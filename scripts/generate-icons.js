import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const table = new Int32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  table[i] = c;
}

function writeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function createPNG(size, isMaskable = false) {
  const width = size;
  const height = size;
  const rawData = Buffer.alloc(height * (1 + width * 4));

  const center = size / 2;
  const radius = isMaskable ? size * 0.32 : size * 0.40;
  const innerRadius = radius * 0.65;
  const coreRadius = radius * 0.28;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background
      let r = 9, g = 9, b = 11, a = 255; // #09090b

      // Ring
      if (dist >= innerRadius && dist <= radius) {
        // Outer glowing ring: Intention into Motion
        const edgeFactor = Math.min(1, Math.min(dist - innerRadius, radius - dist) / (radius * 0.15));
        const alpha = Math.floor(255 * edgeFactor);
        r = Math.floor(240 * edgeFactor + (1 - edgeFactor) * r);
        g = Math.floor(242 * edgeFactor + (1 - edgeFactor) * g);
        b = Math.floor(246 * edgeFactor + (1 - edgeFactor) * b);
      } else if (dist <= coreRadius) {
        // Luminous core: The Real
        const coreFactor = Math.max(0, 1 - (dist / coreRadius));
        r = Math.min(255, Math.floor(r + coreFactor * (255 - r)));
        g = Math.min(255, Math.floor(g + coreFactor * (255 - g)));
        b = Math.min(255, Math.floor(b + coreFactor * (255 - b)));
      } else if (dist > innerRadius * 0.5 && dist < innerRadius) {
        // Subtle aura between core and ring
        const auraFactor = Math.sin((dist - innerRadius * 0.5) / (innerRadius * 0.5) * Math.PI) * 0.18;
        r = Math.floor(r + auraFactor * (56 - r));
        g = Math.floor(g + auraFactor * (189 - g));
        b = Math.floor(b + auraFactor * (248 - b));
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const idat = zlib.deflateSync(rawData);

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    writeChunk('IHDR', ihdr),
    writeChunk('IDAT', idat),
    writeChunk('IEND', Buffer.alloc(0)),
  ]);
}

// Wrap PNG in a standard Microsoft ICO format container
function createICO(pngBuf, size = 32) {
  // ICO Header: 6 bytes
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 for ICO
  header.writeUInt16LE(1, 4); // 1 image

  // Icon Directory Entry: 16 bytes
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
  entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
  entry.writeUInt8(0, 2); // color count (0 for 256 or true color)
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(pngBuf.length, 8); // image size in bytes
  entry.writeUInt32LE(6 + 16, 12); // image offset from start of file

  return Buffer.concat([header, entry, pngBuf]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate SVG
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="128" fill="#09090b"/>
  <circle cx="256" cy="256" r="160" stroke="#f4f4f6" stroke-width="24" stroke-opacity="0.9" stroke-dasharray="720 180"/>
  <circle cx="256" cy="256" r="48" fill="#f4f4f6"/>
  <circle cx="256" cy="256" r="100" stroke="#38bdf8" stroke-width="4" stroke-opacity="0.3" stroke-dasharray="8 8"/>
  <circle cx="369" cy="143" r="16" fill="#38bdf8"/>
</svg>`;

const png32 = createPNG(32);
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);
fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), png32);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createICO(png32, 32));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, true));

console.log('PWA icons created successfully with valid ICO format');
