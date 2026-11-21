// Entry program for news-image-20261121 (round 3, account @dayuwidayadi57).
// The round-3 poster is "THE VERIFIED LEDGER — Saturday 21 November 2026".
// Pinned poster: sha256 0bff7c4a32531b6bdc9c33ef119e9a473a28b7c841fd74fd46facde674c7272e, 201831 bytes.
// This program ships one file, "news-image entry.png", to the grader's
// output directory. Before it copies anything it proves the file is the
// poster this competition grades: a genuine PNG, 1024 by 1024 pixels,
// under the 1 MiB cap, and complete down to its final IEND chunk.
// Anything else fails loudly instead of entering a wrong image.
//
// Round 3 is a correction of round 2 (judge 986.859): the poster keeps the
// classic cream-newspaper grammar and the same three heroes, but fixes the
// one fidelity breach (BepiColombo is now "due tonight", not a completed
// fact), opens the number strip with COP31 Day 13, widens the DATE CHECK
// into two columns, swaps the three soft tail items for Saturday hard news,
// and adds the verification layer — every story carries a CONFIRMED /
// OFFICIAL / REPORTED / CLAIM stamp, explained by the HOW WE CHECKED
// legend at the foot of the page. The drawing script that produced the
// poster (draw_poster_r3.py) refuses to render if any line would not fit,
// so the file this program checks is exactly the file that was drawn.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const POSTER_NAME = "news-image entry.png";
const EXPECTED_SHA256 =
  "0bff7c4a32531b6bdc9c33ef119e9a473a28b7c841fd74fd46facde674c7272e";
const EXPECTED_WIDTH = 1024;
const EXPECTED_HEIGHT = 1024;
const MAX_BYTES = 1048576;
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
// The first chunk of a PNG must be IHDR; its type bytes live at 12-15.
const IHDR_TYPE = [0x49, 0x48, 0x44, 0x52];
// A complete PNG always ends with this 12-byte IEND trailer.
const IEND_TAIL = [
  0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
];

function refuse(reason) {
  throw new Error("entry refused: " + reason);
}

function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  const srcPath = join(here, POSTER_NAME);

  const info = statSync(srcPath);
  if (info.size === 0) refuse(POSTER_NAME + " is empty");
  if (info.size > MAX_BYTES) {
    refuse(POSTER_NAME + " is " + info.size + " bytes, over the 1 MiB cap");
  }

  const bytes = readFileSync(srcPath);
  // The poster is pinned by hash: refuse anything that is not exactly
  // the file this entry was built from.
  const digest = createHash("sha256").update(bytes).digest("hex");
  if (digest !== EXPECTED_SHA256) refuse("poster sha256 mismatch");
  for (let i = 0; i < PNG_MAGIC.length; i++) {
    if (bytes[i] !== PNG_MAGIC[i]) refuse(POSTER_NAME + " is not a PNG file");
  }
  // A truncated file can still carry a valid header, so refuse anything
  // too short to hold the IHDR chunk before reading its dimensions.
  // PNG header layout: width lives at bytes 16-19, height at 20-23,
  // both big-endian 32-bit.
  if (bytes.length < 24) {
    refuse(POSTER_NAME + " is too short to be a complete PNG");
  }
  for (let i = 0; i < IHDR_TYPE.length; i++) {
    if (bytes[12 + i] !== IHDR_TYPE[i]) {
      refuse(POSTER_NAME + " has no IHDR chunk");
    }
  }
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width !== EXPECTED_WIDTH || height !== EXPECTED_HEIGHT) {
    refuse(
      POSTER_NAME + " is " + width + "x" + height + ", expected 1024x1024",
    );
  }
  // The file must end with the IEND chunk, or it was cut off mid-write.
  const tail = bytes.subarray(bytes.length - IEND_TAIL.length);
  for (let i = 0; i < IEND_TAIL.length; i++) {
    if (tail[i] !== IEND_TAIL[i]) {
      refuse(POSTER_NAME + " has no IEND trailer (truncated?)");
    }
  }

  mkdirSync(outDir, { recursive: true });
  const target = join(outDir, "entry.png");
  writeFileSync(target, bytes);

  // A second run must produce the same bytes, so read the copy back and
  // compare it with the source before reporting success.
  const back = readFileSync(target);
  if (!back.equals(bytes)) refuse(target + " does not match the source poster");
  console.log("wrote " + target + " (" + bytes.length + " bytes)");
}

main();
