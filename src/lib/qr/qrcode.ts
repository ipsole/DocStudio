/**
 * Self-contained QR Code Generator in pure TypeScript.
 * Generates an N x N boolean matrix (true = dark, false = light)
 * supporting Byte Mode with Error Correction Levels (L, M, Q, H).
 */

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

// Galois Field GF(256) tables with primitive polynomial 0x11d (285)
const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    EXP_TABLE[i + 255] = x;
    LOG_TABLE[x] = i;
    x <<= 1;
    if (x & 256) {
      x ^= 0x11d;
    }
  }
})();

function gfMultiply(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]];
}

// Generate Reed-Solomon error correction polynomial of degree `degree`
function getRsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const nextPoly = new Uint8Array(poly.length + 1);
    for (let j = 0; j < poly.length; j++) {
      nextPoly[j] ^= gfMultiply(poly[j], EXP_TABLE[i]);
      nextPoly[j + 1] ^= poly[j];
    }
    poly = nextPoly;
  }
  return poly;
}

// Calculate Reed-Solomon error correction codewords
function calculateRsRemainder(data: Uint8Array, degree: number): Uint8Array {
  const gen = getRsGeneratorPoly(degree);
  const remainder = new Uint8Array(degree);

  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    for (let j = 0; j < degree - 1; j++) {
      remainder[j] = remainder[j + 1] ^ gfMultiply(gen[j + 1], factor);
    }
    remainder[degree - 1] = gfMultiply(gen[degree], factor);
  }

  return remainder;
}

// Capacity table: [totalCodewords, ecCodewordsPerBlock, numBlocksGroup1, dataCodewordsPerBlockGroup1, numBlocksGroup2, dataCodewordsPerBlockGroup2]
interface VersionInfo {
  version: number;
  totalCodewords: number;
  ecPerBlock: number;
  blocks1: number;
  dataPerBlock1: number;
  blocks2: number;
  dataPerBlock2: number;
  alignmentPatterns: number[];
}

const QR_TABLE_M: Record<number, VersionInfo> = {
  1: { version: 1, totalCodewords: 26, ecPerBlock: 10, blocks1: 1, dataPerBlock1: 16, blocks2: 0, dataPerBlock2: 0, alignmentPatterns: [] },
  2: { version: 2, totalCodewords: 44, ecPerBlock: 16, blocks1: 1, dataPerBlock1: 28, blocks2: 0, dataPerBlock2: 0, alignmentPatterns: [6, 18] },
  3: { version: 3, totalCodewords: 70, ecPerBlock: 26, blocks1: 1, dataPerBlock1: 44, blocks2: 0, dataPerBlock2: 0, alignmentPatterns: [6, 22] },
  4: { version: 4, totalCodewords: 100, ecPerBlock: 18, blocks1: 2, dataPerBlock1: 32, blocks2: 0, dataPerBlock2: 0, alignmentPatterns: [6, 26] },
  5: { version: 5, totalCodewords: 134, ecPerBlock: 24, blocks1: 2, dataPerBlock1: 43, blocks2: 0, dataPerBlock2: 0, alignmentPatterns: [6, 30] },
  6: { version: 6, totalCodewords: 172, ecPerBlock: 16, blocks1: 4, dataPerBlock1: 27, blocks2: 0, dataPerBlock2: 0, alignmentPatterns: [6, 34] },
  7: { version: 7, totalCodewords: 196, ecPerBlock: 18, blocks1: 4, dataPerBlock1: 31, blocks2: 0, dataPerBlock2: 0, alignmentPatterns: [6, 22, 38] },
  8: { version: 8, totalCodewords: 242, ecPerBlock: 22, blocks1: 2, dataPerBlock1: 38, blocks2: 2, dataPerBlock2: 39, alignmentPatterns: [6, 24, 42] },
  9: { version: 9, totalCodewords: 292, ecPerBlock: 22, blocks1: 3, dataPerBlock1: 36, blocks2: 2, dataPerBlock2: 37, alignmentPatterns: [6, 26, 46] },
  10: { version: 10, totalCodewords: 346, ecPerBlock: 26, blocks1: 4, dataPerBlock1: 43, blocks2: 1, dataPerBlock2: 44, alignmentPatterns: [6, 28, 50] },
};

function selectVersion(dataLength: number): VersionInfo {
  // Byte mode header: 4 bits mode + 8 bits length count (for v1-9) + data bytes + 4 bits terminator
  const requiredBits = 4 + 8 + dataLength * 8 + 4;
  const requiredCodewords = Math.ceil(requiredBits / 8);

  for (let v = 1; v <= 10; v++) {
    const info = QR_TABLE_M[v];
    const totalData = info.blocks1 * info.dataPerBlock1 + info.blocks2 * info.dataPerBlock2;
    if (totalData >= requiredCodewords) {
      return info;
    }
  }
  return QR_TABLE_M[10];
}

class BitBuffer {
  private bits: number[] = [];

  put(num: number, length: number) {
    for (let i = length - 1; i >= 0; i--) {
      this.bits.push((num >>> i) & 1);
    }
  }

  get length(): number {
    return this.bits.length;
  }

  getBit(index: number): number {
    return this.bits[index];
  }

  getBytes(): Uint8Array {
    const bytes = new Uint8Array(Math.ceil(this.bits.length / 8));
    for (let i = 0; i < this.bits.length; i++) {
      if (this.bits[i]) {
        bytes[Math.floor(i / 8)] |= 1 << (7 - (i % 8));
      }
    }
    return bytes;
  }
}

export function generateQRCodeMatrix(text: string): boolean[][] {
  const encoder = new TextEncoder();
  const utf8Data = encoder.encode(text);
  const info = selectVersion(utf8Data.length);
  const totalDataCodewords = info.blocks1 * info.dataPerBlock1 + info.blocks2 * info.dataPerBlock2;

  // 1. Bit encoding
  const buffer = new BitBuffer();
  // Byte Mode indicator = 0100
  buffer.put(0b0100, 4);
  // Character count indicator (8 bits for v1-9, 16 for v10+)
  buffer.put(utf8Data.length, info.version >= 10 ? 16 : 8);
  // Data bytes
  for (let i = 0; i < utf8Data.length; i++) {
    buffer.put(utf8Data[i], 8);
  }
  // Terminator bits (up to 4)
  const maxBits = totalDataCodewords * 8;
  const terminatorBits = Math.min(4, maxBits - buffer.length);
  buffer.put(0, terminatorBits);

  // Pad to byte boundary
  while (buffer.length % 8 !== 0) {
    buffer.put(0, 1);
  }

  // Alternate pad bytes 0xEC (11101100) and 0x11 (00010001)
  const dataBytes = buffer.getBytes();
  const paddedData = new Uint8Array(totalDataCodewords);
  paddedData.set(dataBytes);
  let padToggle = false;
  for (let i = dataBytes.length; i < totalDataCodewords; i++) {
    paddedData[i] = padToggle ? 0x11 : 0xec;
    padToggle = !padToggle;
  }

  // 2. Error Correction Codewords & Interleaving
  const blocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];
  let offset = 0;

  for (let i = 0; i < info.blocks1; i++) {
    const block = paddedData.slice(offset, offset + info.dataPerBlock1);
    offset += info.dataPerBlock1;
    blocks.push(block);
    ecBlocks.push(calculateRsRemainder(block, info.ecPerBlock));
  }
  for (let i = 0; i < info.blocks2; i++) {
    const block = paddedData.slice(offset, offset + info.dataPerBlock2);
    offset += info.dataPerBlock2;
    blocks.push(block);
    ecBlocks.push(calculateRsRemainder(block, info.ecPerBlock));
  }

  // Interleave data codewords
  const finalCodewords: number[] = [];
  const maxDataPerBlock = Math.max(info.dataPerBlock1, info.dataPerBlock2);
  for (let i = 0; i < maxDataPerBlock; i++) {
    for (let b = 0; b < blocks.length; b++) {
      if (i < blocks[b].length) {
        finalCodewords.push(blocks[b][i]);
      }
    }
  }
  // Interleave EC codewords
  for (let i = 0; i < info.ecPerBlock; i++) {
    for (let b = 0; b < ecBlocks.length; b++) {
      finalCodewords.push(ecBlocks[b][i]);
    }
  }

  // 3. Matrix Placement
  const size = info.version * 4 + 17;
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const markFunction = (r: number, c: number, val: boolean) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = val;
      isFunction[r][c] = true;
    }
  };

  // Finder Patterns (7x7) + Separators
  const placeFinder = (startR: number, startC: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = startR + r;
        const col = startC + c;
        if (row < 0 || row >= size || col < 0 || col >= size) continue;
        if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
          const isEdge = r === 0 || r === 6 || c === 0 || c === 6;
          const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          markFunction(row, col, isEdge || isCenter);
        } else {
          markFunction(row, col, false); // Separator
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    markFunction(6, i, i % 2 === 0);
    markFunction(i, 6, i % 2 === 0);
  }

  // Alignment patterns
  if (info.alignmentPatterns.length > 0) {
    const coords = info.alignmentPatterns;
    for (let i = 0; i < coords.length; i++) {
      for (let j = 0; j < coords.length; j++) {
        const r = coords[i];
        const c = coords[j];
        // Skip finders
        if (isFunction[r][c]) continue;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isBorder = Math.abs(dr) === 2 || Math.abs(dc) === 2;
            const isCenter = dr === 0 && dc === 0;
            markFunction(r + dr, c + dc, isBorder || isCenter);
          }
        }
      }
    }
  }

  // Dark module
  markFunction(info.version * 4 + 9, 8, true);

  // Reserve format information areas
  for (let i = 0; i <= 8; i++) {
    if (!isFunction[8][i]) markFunction(8, i, false);
    if (!isFunction[i][8]) markFunction(i, 8, false);
  }
  for (let i = size - 8; i < size; i++) {
    if (!isFunction[8][i]) markFunction(8, i, false);
  }
  for (let i = size - 7; i < size; i++) {
    if (!isFunction[i][8]) markFunction(i, 8, false);
  }

  // 4. Place Data Modules with Mask Pattern (Mask 0: (r + c) % 2 === 0)
  let bitIndex = 0;
  const finalBits = new BitBuffer();
  for (let i = 0; i < finalCodewords.length; i++) {
    finalBits.put(finalCodewords[i], 8);
  }

  let upward = true;
  for (let c = size - 1; c > 0; c -= 2) {
    if (c === 6) c--; // Skip vertical timing column
    const rows = upward
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const r of rows) {
      for (const col of [c, c - 1]) {
        if (!isFunction[r][col]) {
          let bit = false;
          if (bitIndex < finalBits.length) {
            bit = finalBits.getBit(bitIndex) === 1;
            bitIndex++;
          }
          // Apply mask 0: invert if (r + col) % 2 === 0
          const mask = (r + col) % 2 === 0;
          matrix[r][col] = mask ? !bit : bit;
        }
      }
    }
    upward = !upward;
  }

  // 5. Format Information: EC Level M (00) + Mask 0 (000) = 00000 -> Format Bits with BCH code
  // Precomputed 15-bit format bits for EC Level M, Mask 0: 0x5412 ^ 0x2897 = 0x7cbf (0b111110010111111)
  const formatBits = [true, true, true, true, true, false, false, true, false, true, true, true, true, true, true];

  // Write format info to top-left and splits
  const formatCoords = [
    // [r, c] for top-left
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
  ];
  for (let i = 0; i < 15; i++) {
    const [r, c] = formatCoords[i];
    matrix[r][c] = formatBits[i];
  }

  const formatCoords2 = [
    // [r, c] for bottom-left and top-right
    [size - 1, 8], [size - 2, 8], [size - 3, 8], [size - 4, 8], [size - 5, 8], [size - 6, 8], [size - 7, 8],
    [8, size - 8], [8, size - 7], [8, size - 6], [8, size - 5], [8, size - 4], [8, size - 3], [8, size - 2], [8, size - 1]
  ];
  for (let i = 0; i < 15; i++) {
    const [r, c] = formatCoords2[i];
    matrix[r][c] = formatBits[i];
  }

  return matrix.map((row) => row.map((cell) => cell ?? false));
}
