// Turns the studio's multi-hundred-MB master films into web-ready scroll
// assets. Run manually — never at build time:
//
//   node scripts/build-media.mjs            # build anything missing
//   node scripts/build-media.mjs --force    # rebuild everything
//   node scripts/build-media.mjs ulwe-penthouse   # rebuild one slug
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

async function buildOne(entry) {
  const { slug, source, start, duration, segments, frames, posterAt } = entry;
  const quality = entry.frameQuality ?? FRAME_QUALITY;
  const width = entry.frameWidth ?? FRAME_WIDTH;
  // Rows trimmed off the top of the source, for masters with a logo or caption
  // burnt into the picture. Applied before scaling, so it is expressed in
  // source pixels.
  const cropTop = entry.cropTop ?? 0;
  const crop = cropTop ? `crop=iw:ih-${cropTop}:0:${cropTop},` : "";
  const src = path.join(ROOT, source);
  if (!existsSync(src)) {
    console.error(`  ✗ ${slug}: master not found — ${source}`);
    return false;
  }

  const outDir = path.join(OUT_ROOT, slug);
  const framesDir = path.join(outDir, "frames");

  if (existsSync(path.join(outDir, "meta.json")) && !force) {
    console.log(`  · ${slug}: already built (use --force to redo)`);
    return true;
  }

  await rm(framesDir, { recursive: true, force: true });
  await mkdir(framesDir, { recursive: true });

  // Frame sequence. -ss before -i seeks fast; fps filter spreads the
  // requested frame count evenly across the chosen stretch of footage.
  const extract = (from, length, count, pattern) =>
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
      await extract(seg.start, length, counts[s], path.join(stage, "%04d.webp"));

      const got = (await readdir(stage)).filter((f) => f.endsWith(".webp")).sort();
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
    await extract(start, duration, frames, path.join(framesDir, "%04d.webp"));
  }

  // Poster still — the first thing a visitor sees, so it gets a touch more
  // quality than the sequence frames.
  await run(
    ffmpegPath,
    [
      "-hide_banner", "-loglevel", "error", "-y",
      "-ss", String(posterAt),
      "-i", src,
      "-frames:v", "1",
      "-vf", `${crop}scale=${width}:-2`,
      "-c:v", "libwebp",
      "-quality", "82",
      "-preset", "photo",
      path.join(outDir, "poster.webp"),
    ],
    { maxBuffer: 1024 * 1024 * 16 }
  );

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
        height: Number(dim[2]) || Math.round((width * 9) / 16),
        ...(segments
          ? { segments: segments.map(({ start: s, end, label }) => ({ start: s, end, label })) }
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
