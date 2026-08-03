const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height) {
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }

  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ (-1)) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const combined = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(combined), 0);
    return Buffer.concat([len, combined, crcBuf]);
  }

  const header = Buffer.from([139, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const ihdrChunk = chunk('IHDR', ihdr);

  const rawData = Buffer.alloc(height * (width * 4 + 1));
  let offset = 0;

  const bgR = 37, bgG = 99, bgB = 235, bgA = 255;
  const iconR = 255, iconG = 255, iconB = 255, iconA = 255;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0;
    for (let x = 0; x < width; x++) {
      const nx = (x / width) - 0.5;
      const ny = (y / height) - 0.5;
      const distSq = nx * nx + ny * ny;

      const inBookLeft = nx >= -0.3 && nx <= -0.05 && ny >= -0.25 && ny <= 0.25;
      const inBookRight = nx >= 0.05 && nx <= 0.3 && ny >= -0.25 && ny <= 0.25;
      const inRibbon = nx >= -0.08 && nx <= 0.08 && ny >= -0.35 && ny <= 0.1;

      let r = bgR, g = bgG, b = bgB, a = bgA;

      if (distSq > 0.22) {
        a = 0;
      } else if (inBookLeft || inBookRight || inRibbon) {
        r = iconR; g = iconG; b = iconB; a = iconA;
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = chunk('IDAT', compressedData);
  const iendChunk = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

[16, 48, 128].forEach(size => {
  const iconPath = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(iconPath, createPNG(size, size));
  console.log(`Generated ${iconPath}`);
});
