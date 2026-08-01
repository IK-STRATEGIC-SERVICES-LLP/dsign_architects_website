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
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
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

async function buildOne(entry) {
  const { slug, source, start, duration, frames, posterAt } = entry;
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
  // requested frame count evenly across the chosen segment.
  await run(
    ffmpegPath,
    [
      "-hide_banner", "-loglevel", "error", "-y",
      "-ss", String(start),
      "-t", String(duration),
      "-i", src,
      "-vf", `fps=${frames}/${duration},scale=${FRAME_WIDTH}:-2`,
      "-c:v", "libwebp",
      "-quality", String(FRAME_QUALITY),
      "-preset", "photo",
      "-compression_level", "6",
      path.join(framesDir, "%04d.webp"),
    ],
    { maxBuffer: 1024 * 1024 * 64 }
  );

  // Poster still — the first thing a visitor sees, so it gets a touch more
  // quality than the sequence frames.
  await run(
    ffmpegPath,
    [
      "-hide_banner", "-loglevel", "error", "-y",
      "-ss", String(posterAt),
      "-i", src,
      "-frames:v", "1",
      "-vf", `scale=${FRAME_WIDTH}:-2`,
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

  // Probe the real output dimensions rather than assuming 16:9.
  const { stdout } = await run(ffmpegPath, [
    "-hide_banner", "-i", path.join(framesDir, written[0]),
  ]).catch((e) => ({ stdout: "", stderr: e.stderr ?? "" }));
  const dim = /(\d{3,5})x(\d{3,5})/.exec(stdout) ?? [];

  await writeFile(
    path.join(outDir, "meta.json"),
    JSON.stringify(
      {
        slug,
        frameCount: written.length,
        width: Number(dim[1]) || FRAME_WIDTH,
        height: Number(dim[2]) || Math.round((FRAME_WIDTH * 9) / 16),
        segment: { start, duration },
      },
      null,
      2
    ) + "\n"
  );

  const size = await dirSize(framesDir);
  console.log(
    `  ✓ ${slug}: ${written.length} frames, ${fmtBytes(size)} (${fmtBytes(size / written.length)}/frame)`
  );
  return true;
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
