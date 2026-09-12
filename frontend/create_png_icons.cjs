const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPng(width, height, drawFn) {
  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit depth
  ihdrData.writeUInt8(6, 9); // RGBA color type
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);
  const ihdr = makeChunk('IHDR', ihdrData);

  // Raw image data with filter byte (0) prefix per scanline
  const rowStride = width * 4;
  const rawData = Buffer.alloc(height * (1 + rowStride));

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  // Compress IDAT with zlib
  const compressed = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressed);

  // IEND chunk
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4);
  data.copy(buf, 8);

  const crc = calcCrc32(buf.slice(4, 8 + len));
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

// CRC32 table & calculation
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function calcCrc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Shader for Inspectra Pro Icon
function inspectraIconShader(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const r = w / 2;
  const dx = (x - cx) / r;
  const dy = (y - cy) / r;
  const distSq = dx * dx + dy * dy;

  // Outer rounded squircle background: #0f172a to #0284c7 gradient
  if (distSq > 0.88) {
    return [0, 0, 0, 0]; // Transparent outside
  }

  // Gradient background
  const t = (y / h) * 0.7 + (x / w) * 0.3;
  let bgR = Math.round(15 + t * (2 - 15));
  let bgG = Math.round(23 + t * (132 - 23));
  let bgB = Math.round(42 + t * (199 - 42));

  // Glowing cyan border ring
  if (distSq > 0.75 && distSq <= 0.88) {
    return [56, 189, 248, 255]; // Cyan ring (#38bdf8)
  }

  // Draw Shield / Hexagon Shape in Center
  const nx = Math.abs(dx) / 0.55;
  const ny = (dy + 0.1) / 0.55;
  if (nx <= 1 && ny <= 1 && (nx + ny * 0.6) <= 1.2) {
    // Inside shield emblem: Bright glowing cyan
    if (distSq < 0.25) {
      return [255, 255, 255, 255]; // White core
    }
    return [56, 189, 248, 255]; // Cyan emblem
  }

  return [Math.max(0, Math.min(255, bgR)), Math.max(0, Math.min(255, bgG)), Math.max(0, Math.min(255, bgB)), 255];
}

// Generate icon-192.png and icon-512.png
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

const png192 = createPng(192, 192, inspectraIconShader);
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), png192);
console.log('Generated public/icon-192.png (' + png192.length + ' bytes)');

const png512 = createPng(512, 512, inspectraIconShader);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), png512);
console.log('Generated public/icon-512.png (' + png512.length + ' bytes)');
