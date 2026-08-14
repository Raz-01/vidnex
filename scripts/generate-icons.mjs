// Generates PWA/favicon PNGs from the vidnex flame mark. Run: npm run icons
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const iconsDir = path.join(root, "public", "icons");

// Same mark as components/ui/logo.tsx, on an explicit canvas so it works
// standalone as a raster (no <defs> gradient id collisions when composed
// with a background rect for maskable icons).
const markSvg = (size, { background } = {}) => `
<svg width="${size}" height="${size}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="4" y1="6" x2="44" y2="42" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ff6b3d" />
      <stop offset="55%" stop-color="#ff3d77" />
      <stop offset="100%" stop-color="#c026d3" />
    </linearGradient>
  </defs>
  ${background ? `<rect width="48" height="48" fill="${background}" />` : ""}
  <path d="M24 3c6 6.5 11 12.7 11 19.4C35 30.9 30.1 37 24 37c-6.1 0-11-6.1-11-14.6C13 15.7 18 9.5 24 3Z" fill="url(#g)" />
  <path d="M20 17.5 30 23l-10 5.5v-11Z" fill="${background ?? "#0b0a0e"}" />
</svg>`;

// Maskable icons need real padding inside the safe zone (~40% margin) so
// Android's circular/squircle crop never clips the mark.
const maskableSvg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <rect width="48" height="48" fill="#0b0a0e" />
  <g transform="translate(12 12) scale(0.5)">
    ${markSvg(48).match(/<defs>[\s\S]*?<\/defs>/)[0]}
    <path d="M24 3c6 6.5 11 12.7 11 19.4C35 30.9 30.1 37 24 37c-6.1 0-11-6.1-11-14.6C13 15.7 18 9.5 24 3Z" fill="url(#g)" />
    <path d="M20 17.5 30 23l-10 5.5v-11Z" fill="#0b0a0e" />
  </g>
</svg>`;

async function render(svg, size, filename) {
  const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  await writeFile(path.join(iconsDir, filename), buf);
  console.log("wrote", filename);
}

await mkdir(iconsDir, { recursive: true });

await render(markSvg(192, { background: "#0b0a0e" }), 192, "icon-192.png");
await render(markSvg(512, { background: "#0b0a0e" }), 512, "icon-512.png");
await render(markSvg(180, { background: "#0b0a0e" }), 180, "apple-touch-icon.png");
await render(maskableSvg(512), 512, "icon-512-maskable.png");

// App Router favicon (Next.js serves app/icon.png automatically).
const appIconSvg = markSvg(64, { background: "#0b0a0e" });
const appIconBuf = await sharp(Buffer.from(appIconSvg)).resize(64, 64).png().toBuffer();
await writeFile(path.join(root, "app", "icon.png"), appIconBuf);
console.log("wrote app/icon.png");
