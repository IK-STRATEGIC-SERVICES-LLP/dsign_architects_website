// Turns the studio's multi-hundred-MB master films into web-ready scroll
// assets. Run manually — never at build time:
//
//   node scripts/build-media.mjs            # build anything missing
//   node scripts/build-media.mjs --force    # rebuild everything
//   node scripts/build-media.mjs ulwe-penthouse   # rebuild one slug
//   node scripts/build-media.mjs --posters  # redo posters only, keep frames
//
// Output per slug in public/media/<slug>/:
//   frames/0001.webp …   scroll-scrubbed sequence
//   poster.webp          still used before frames load, and as the
//                        mobile / reduced-motion / no-JS fallback
//   meta.json            actual frame count + dimensions for the client
//
// The masters themselves stay in public/videos, which is gitignored.

import { execFile } from "node:child_process";
import { mkdir, readdir, rename, rm, writeFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { promisify } from "node:util";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";
import { MEDIA, FRAME_WIDTH, FRAME_QUALITY } from "./media-manifest.mjs";

const run = promisify(execFile);
const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_ROOT = path.join(ROOT, "public", "media");

const args = process.argv.slice(2);
const force = args.includes("--force");
// Choosing a poster is picking a still, and it wants iterating on. Extracting
// several hundred frames again each time you try a different second of the
// film would make that unbearable, so this redoes the poster alone and leaves
// frames/ and meta.json exactly as they are.
const postersOnly = args.includes("--posters");
const only = args.filter((a) => !a.startsWith("--"));

function fmtBytes(n) {
  return n > 1024 * 1024
    ? `${(n / 1024 / 1024).toFixed(1)}MB`
    : `${(n / 1024).toFixed(0)}KB`;
}

async function dirSize(dir) {
  const files = await readdir(dir);
  return files.reduce((sum, f) => sum + statSync(path.join(dir, f)).size, 0);
}

/**
 * Shares `total` frames across segments in proportion to their length, using
 * largest-remainder so the parts add up to exactly `total`. Every segment gets
 * at least one frame.
 */
function allocate(segments, total) {
  const lengths = segments.map((s) => s.end - s.start);
  const span = lengths.reduce((a, b) => a + b, 0);
  const exact = lengths.map((len) => (len / span) * total);
  const counts = exact.map((n) => Math.max(1, Math.floor(n)));

  let short = total - counts.reduce((a, b) => a + b, 0);
  const byRemainder = exact
    .map((n, i) => ({ i, rem: n - Math.floor(n) }))
    .sort((a, b) => b.rem - a.rem);
  for (let k = 0; short > 0; k++, short--) counts[byRemainder[k % counts.length].i]++;
  // Over-allocated (many tiny segments hitting the floor of 1): trim the
  // longest until it balances, so the total is always honoured.
  while (short < 0) {
    const biggest = counts.indexOf(Math.max(...counts));
    counts[biggest]--;
    short++;
  }
  return counts;
}

/** Length of a master in seconds, read off ffmpeg's stream table. */
async function probeDuration(src) {
  const { stderr } = await run(ffmpegPath, ["-hide_banner", "-i", src]).catch(
    (e) => ({ stderr: e.stderr ?? "" })
  );
  const m = /Duration: (\d+):(\d+):(\d+\.?\d*)/.exec(stderr);
  if (!m) throw new Error(`could not read duration of ${path.basename(src)}`);
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

/**
 * Fills in the defaults a segment is allowed to omit, so the rest of the build
 * can assume every segment names a file and a concrete window into it:
 * `source` falls back to the entry's, and a segment with no `start`/`end` means
 * the whole clip — which is the normal case when the studio delivers each shot
 * as its own file rather than one long reel.
 */
async function resolveSegments(entry) {
  const out = [];
  for (const seg of entry.segments) {
    const source = seg.source ?? entry.source;
    if (!source) throw new Error(`segment "${seg.label ?? "?"}" has no source`);
    const start = seg.start ?? 0;
    const end = seg.end ?? (await probeDuration(path.join(ROOT, source)));
    out.push({ ...seg, source, start, end });
  }
  return out;
}

async function buildOne(entry) {
  const { slug, source, start, duration, frames, posterAt } = entry;
  const quality = entry.frameQuality ?? FRAME_QUALITY;
  const width = entry.frameWidth ?? FRAME_WIDTH;
  // Rows trimmed off the top of the source, for masters with a logo or caption
  // burnt into the picture. Applied before scaling, so it is expressed in
  // source pixels.
  const cropTop = entry.cropTop ?? 0;
  // Centre crop to a target aspect (width / height), for the phone-sized
  // builds. ffmpeg's crop centres by default when x/y are omitted, so the
  // shot keeps its own centre of interest rather than one chosen here.
  // Only ever narrows: a value above the source's own aspect would ask for
  // more width than exists and ffmpeg would refuse.
  const cropAspect = entry.cropAspect ?? 0;
  const cropChain = [
    cropTop ? `crop=iw:ih-${cropTop}:0:${cropTop}` : null,
    cropAspect ? `crop=ih*${cropAspect}:ih` : null,
  ].filter(Boolean);
  const crop = cropChain.length ? `${cropChain.join(",")},` : "";

  // Bands trimmed off the poster only, as a fraction of height. Most of these
  // masters carry burnt-in furniture the studio cannot remove from the film —
  // their own mark and phone number along the top, shot captions across the
  // foot, and on the Lucknow villa another practice's logo entirely. Inside
  // the scrub that furniture is the film and has to be lived with, but the
  // poster is the still that represents the project on the projects page and
  // in cards, and it should carry none of it.
  //
  // Poster-only, so trimming here never reframes the sequence: the frames and
  // the poster stop being the same crop, which is fine, they are used in
  // different places and at different sizes.
  const pTop = entry.posterCropTop ?? 0;
  const pBottom = entry.posterCropBottom ?? 0;
  const posterTrim =
    pTop || pBottom
      ? `crop=iw:ih*${(1 - pTop - pBottom).toFixed(4)}:0:ih*${pTop.toFixed(4)},`
      : "";
  // cropTop first (source pixels), then the poster bands, then the aspect
  // crop last so the phone poster still centres on what survives.
  const posterCrop =
    (cropTop ? `crop=iw:ih-${cropTop}:0:${cropTop},` : "") +
    posterTrim +
    (cropAspect ? `crop=ih*${cropAspect}:ih,` : "");
  const segments = entry.segments ? await resolveSegments(entry) : undefined;
  // The poster may come from a different clip than the frames when the shots
  // are delivered as separate files — the opening shot rarely makes the best
  // still.
  const posterSource = entry.posterSource ?? source;

  const needed = postersOnly
    ? [posterSource]
    : [...(segments ? segments.map((s) => s.source) : [source]), posterSource];
  const missing = [...new Set(needed)].filter(
    (rel) => !rel || !existsSync(path.join(ROOT, rel))
  );
  if (missing.length) {
    console.error(`  ✗ ${slug}: master(s) not found — ${missing.join(", ")}`);
    return false;
  }

  const outDir = path.join(OUT_ROOT, slug);
  const framesDir = path.join(outDir, "frames");

  // Poster still — the project's representative image, used on the projects
  // page and in cards, so it gets a touch more quality than sequence frames.
  const writePoster = () =>
    run(
      ffmpegPath,
      [
        "-hide_banner", "-loglevel", "error", "-y",
        "-ss", String(posterAt),
        "-i", path.join(ROOT, posterSource),
        "-frames:v", "1",
        "-vf", `${posterCrop}scale=${width}:-2`,
        "-c:v", "libwebp",
        "-quality", "82",
        "-preset", "photo",
        path.join(outDir, "poster.webp"),
      ],
      { maxBuffer: 1024 * 1024 * 16 }
    );

  if (existsSync(path.join(outDir, "meta.json")) && !force && !postersOnly) {
    console.log(`  · ${slug}: already built (use --force to redo)`);
    return true;
  }

  if (postersOnly) {
    if (!existsSync(path.join(outDir, "meta.json"))) {
      console.error(`  ✗ ${slug}: not built yet — run without --posters first`);
      return false;
    }
    await writePoster();
    console.log(`  ✓ ${slug}: poster redone at ${posterAt}s`);
    return true;
  }

  await rm(framesDir, { recursive: true, force: true });
  await mkdir(framesDir, { recursive: true });

  // Frame sequence. -ss before -i seeks fast; fps filter spreads the
  // requested frame count evenly across the chosen stretch of footage.
  const extract = (from, length, count, pattern, src) =>
    run(
      ffmpegPath,
      [
        "-hide_banner", "-loglevel", "error", "-y",
        "-ss", String(from),
        "-t", String(length),
        "-i", src,
        "-vf", `${crop}fps=${count}/${length},scale=${width}:-2`,
        "-c:v", "libwebp",
        "-quality", String(quality),
        "-preset", "photo",
        "-compression_level", "6",
        pattern,
      ],
      { maxBuffer: 1024 * 1024 * 64 }
    );

  if (segments) {
    // Each window is extracted to its own scratch directory, then the results
    // are renumbered into one continuous sequence. Extracting straight into
    // framesDir with an offset pattern would work only if ffmpeg produced
    // exactly the requested count every time, and it does not — a window
    // ending near a keyframe boundary can come back a frame short.
    const counts = allocate(segments, frames);
    let n = 0;
    for (let s = 0; s < segments.length; s++) {
      const seg = segments[s];
      const stage = path.join(outDir, `.seg${s}`);
      await rm(stage, { recursive: true, force: true });
      await mkdir(stage, { recursive: true });

      const length = seg.end - seg.start;
      await extract(
        seg.start,
        length,
        counts[s],
        path.join(stage, "%04d.webp"),
        path.join(ROOT, seg.source)
      );

      const got = (await readdir(stage)).filter((f) => f.endsWith(".webp")).sort();
      // `reverse` plays a window backwards. Not a trick for its own sake: a
      // camera move that retreats through a gateway as the doors swing shut
      // is, run the other way, the doors opening and the camera walking in —
      // which is the shot the studio wanted to end on and never filmed. In a
      // scroll-scrub the visitor drives the direction anyway, so nothing here
      // reads as "played backwards" the way it would in a video.
      if (seg.reverse) got.reverse();
      for (const f of got) {
        n++;
        await rename(
          path.join(stage, f),
          path.join(framesDir, `${String(n).padStart(4, "0")}.webp`)
        );
      }
      await rm(stage, { recursive: true, force: true });
      console.log(
        `      ${String(s + 1).padStart(2)}. ${seg.label ?? `${seg.start}s`} — ${got.length} frames`
      );
    }
  } else {
    await extract(
      start,
      duration,
      frames,
      path.join(framesDir, "%04d.webp"),
      path.join(ROOT, source)
    );
  }

  await writePoster();

  const written = (await readdir(framesDir)).filter((f) => f.endsWith(".webp")).sort();
  if (written.length === 0) {
    console.error(`  ✗ ${slug}: ffmpeg produced no frames`);
    return false;
  }

  // Probe the real output dimensions rather than assuming 16:9. `ffmpeg -i`
  // with no output file always exits non-zero and prints the stream table on
  // stderr, so both the failure and stderr are the expected path here — read
  // stdout only and this silently falls through to the 16:9 guess, which is
  // wrong for any cropped set.
  const probe = await run(ffmpegPath, [
    "-hide_banner", "-i", path.join(framesDir, written[0]),
  ]).catch((e) => ({ stdout: e.stdout ?? "", stderr: e.stderr ?? "" }));
  const dim =
    /Video:.*?\s(\d{2,5})x(\d{2,5})/.exec(probe.stderr || probe.stdout) ?? [];

  await writeFile(
    path.join(outDir, "meta.json"),
    JSON.stringify(
      {
        slug,
        frameCount: written.length,
        width: Number(dim[1]) || width,
        height:
          Number(dim[2]) ||
          Math.round(cropAspect ? width / cropAspect : (width * 9) / 16),
        ...(segments
          ? {
              segments: segments.map(({ start: s, end, label, source: from }) => ({
                start: s,
                end,
                label,
                source: path.basename(from),
              })),
            }
          : { segment: { start, duration } }),
      },
      null,
      2
    ) + "\n"
  );

  // These masters fade through black between shots rather than cutting, so a
  // badly placed window silently bakes black frames into the middle of the
  // scrub — which reads as a flicker on the page, not as an obvious build
  // error. Cheap to catch here, tedious to spot by scrolling.
  const black = await findBlackFrames(framesDir, written.length);
  if (black.length) {
    console.error(
      `  ! ${slug}: ${black.length} near-black frame(s) — ${black.slice(0, 12).join(", ")}` +
        `${black.length > 12 ? " …" : ""}\n` +
        `    A segment boundary is sitting inside a fade-to-black. Move it clear.`
    );
  }

  const size = await dirSize(framesDir);
  console.log(
    `  ✓ ${slug}: ${written.length} frames, ${fmtBytes(size)} (${fmtBytes(size / written.length)}/frame)`
  );
  return black.length === 0;
}

/** 1-based indices of frames that are essentially black. */
async function findBlackFrames(framesDir, count) {
  const { stderr } = await run(
    ffmpegPath,
    [
      "-hide_banner", "-loglevel", "info", "-y",
      "-f", "image2", "-framerate", "25",
      "-i", path.join(framesDir, "%04d.webp"),
      "-vf", "blackframe=amount=90:threshold=40",
      "-an", "-f", "null", "-",
    ],
    { maxBuffer: 1024 * 1024 * 32 }
  ).catch((e) => ({ stderr: e.stderr ?? "" }));

  const hits = [];
  for (const m of stderr.matchAll(/Parsed_blackframe\S*\s+frame:(\d+)/g)) {
    const i = Number(m[1]) + 1; // blackframe reports 0-based
    if (i >= 1 && i <= count) hits.push(i);
  }
  return hits;
}

const targets = only.length ? MEDIA.filter((m) => only.includes(m.slug)) : MEDIA;
if (targets.length === 0) {
  console.error(`No manifest entries matched: ${only.join(", ")}`);
  process.exit(1);
}

console.log(`Building ${targets.length} media set(s) → public/media\n`);
let failures = 0;
for (const entry of targets) {
  try {
    const ok = await buildOne(entry);
    if (!ok) failures++;
  } catch (err) {
    failures++;
    console.error(`  ✗ ${entry.slug}: ${err.shortMessage ?? err.message}`);
  }
}

const total = existsSync(OUT_ROOT)
  ? (await readdir(OUT_ROOT)).length
  : 0;
console.log(`\nDone. ${total} media set(s) in public/media.`);
process.exit(failures ? 1 : 0);
