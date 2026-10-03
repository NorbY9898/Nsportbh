const QR_SPECS = Object.freeze([
  null,
  { version: 1, dataCodewords: 19, ecCodewords: 7, blocks: [19], alignment: [] },
  { version: 2, dataCodewords: 34, ecCodewords: 10, blocks: [34], alignment: [6, 18] },
  { version: 3, dataCodewords: 55, ecCodewords: 15, blocks: [55], alignment: [6, 22] },
  { version: 4, dataCodewords: 80, ecCodewords: 20, blocks: [80], alignment: [6, 26] },
  { version: 5, dataCodewords: 108, ecCodewords: 26, blocks: [108], alignment: [6, 30] },
  { version: 6, dataCodewords: 136, ecCodewords: 18, blocks: [68, 68], alignment: [6, 34] },
  { version: 7, dataCodewords: 156, ecCodewords: 20, blocks: [78, 78], alignment: [6, 22, 38] },
  { version: 8, dataCodewords: 194, ecCodewords: 24, blocks: [97, 97], alignment: [6, 24, 42] }
]);

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
let fieldValue = 1;
for (let index = 0; index < 255; index += 1) {
  GF_EXP[index] = fieldValue;
  GF_LOG[fieldValue] = index;
  fieldValue <<= 1;
  if (fieldValue & 0x100) fieldValue ^= 0x11d;
}
for (let index = 255; index < GF_EXP.length; index += 1) GF_EXP[index] = GF_EXP[index - 255];

function gfMultiply(left, right) {
  return left && right ? GF_EXP[GF_LOG[left] + GF_LOG[right]] : 0;
}

function polynomialMultiply(left, right) {
  const result = new Uint8Array(left.length + right.length - 1);
  left.forEach((a, leftIndex) => right.forEach((b, rightIndex) => {
    result[leftIndex + rightIndex] ^= gfMultiply(a, b);
  }));
  return result;
}

function reedSolomonDivisor(degree) {
  let result = Uint8Array.of(1);
  for (let index = 0; index < degree; index += 1) {
    result = polynomialMultiply(result, Uint8Array.of(1, GF_EXP[index]));
  }
  return result;
}

function reedSolomonRemainder(data, degree) {
  const divisor = reedSolomonDivisor(degree);
  const result = new Uint8Array(degree);
  data.forEach((byte) => {
    const factor = byte ^ result[0];
    result.copyWithin(0, 1);
    result[degree - 1] = 0;
    for (let index = 0; index < degree; index += 1) {
      result[index] ^= gfMultiply(divisor[index + 1], factor);
    }
  });
  return result;
}

function appendBits(target, value, length) {
  for (let bit = length - 1; bit >= 0; bit -= 1) target.push((value >>> bit) & 1);
}

function dataCodewords(bytes, spec) {
  const bits = [];
  appendBits(bits, 0b0100, 4);
  appendBits(bits, bytes.length, 8);
  bytes.forEach((byte) => appendBits(bits, byte, 8));
  const capacity = spec.dataCodewords * 8;
  appendBits(bits, 0, Math.min(4, capacity - bits.length));
  while (bits.length % 8) bits.push(0);
  const result = [];
  for (let offset = 0; offset < bits.length; offset += 8) {
    result.push(bits.slice(offset, offset + 8).reduce((byte, bit) => (byte << 1) | bit, 0));
  }
  for (let pad = 0; result.length < spec.dataCodewords; pad += 1) result.push(pad % 2 ? 0x11 : 0xec);
  return Uint8Array.from(result);
}

function interleaveWithErrorCorrection(data, spec) {
  const blocks = [];
  let offset = 0;
  spec.blocks.forEach((length) => {
    const blockData = data.slice(offset, offset + length);
    blocks.push({ data: blockData, ecc: reedSolomonRemainder(blockData, spec.ecCodewords) });
    offset += length;
  });
  const result = [];
  const longest = Math.max(...spec.blocks);
  for (let index = 0; index < longest; index += 1) {
    blocks.forEach((block) => { if (index < block.data.length) result.push(block.data[index]); });
  }
  for (let index = 0; index < spec.ecCodewords; index += 1) {
    blocks.forEach((block) => result.push(block.ecc[index]));
  }
  return Uint8Array.from(result);
}

function selectSpec(byteLength) {
  const spec = QR_SPECS.slice(1).find((candidate) => byteLength <= candidate.dataCodewords - 2);
  if (!spec) throw new RangeError("Datele pentru codul QR sunt prea lungi.");
  return spec;
}

function formatBits(mask) {
  const data = (1 << 3) | mask; // nivel de corecție L
  let remainder = data;
  for (let index = 0; index < 10; index += 1) remainder = (remainder << 1) ^ ((remainder >>> 9) * 0x537);
  return ((data << 10) | remainder) ^ 0x5412;
}

function versionBits(version) {
  let remainder = version;
  for (let index = 0; index < 12; index += 1) remainder = (remainder << 1) ^ ((remainder >>> 11) * 0x1f25);
  return (version << 12) | remainder;
}

function maskBit(mask, x, y) {
  if (mask === 0) return (x + y) % 2 === 0;
  return false;
}

function createEmptyMatrix(size) {
  return {
    modules: Array.from({ length: size }, () => Array(size).fill(false)),
    functions: Array.from({ length: size }, () => Array(size).fill(false))
  };
}

function drawFunctionPatterns(matrix, spec, mask) {
  const { modules, functions } = matrix;
  const size = modules.length;
  const set = (x, y, value) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    modules[y][x] = Boolean(value);
    functions[y][x] = true;
  };
  const finder = (centerX, centerY) => {
    for (let dy = -4; dy <= 4; dy += 1) for (let dx = -4; dx <= 4; dx += 1) {
      const distance = Math.max(Math.abs(dx), Math.abs(dy));
      set(centerX + dx, centerY + dy, distance === 3 || distance <= 1);
    }
  };
  finder(3, 3);
  finder(size - 4, 3);
  finder(3, size - 4);
  for (let index = 8; index < size - 8; index += 1) {
    set(6, index, index % 2 === 0);
    set(index, 6, index % 2 === 0);
  }
  spec.alignment.forEach((centerY) => spec.alignment.forEach((centerX) => {
    if (functions[centerY][centerX]) return;
    for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) {
      set(centerX + dx, centerY + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  }));
  const bits = formatBits(mask);
  const bit = (index) => ((bits >>> index) & 1) !== 0;
  for (let index = 0; index <= 5; index += 1) set(8, index, bit(index));
  set(8, 7, bit(6));
  set(8, 8, bit(7));
  set(7, 8, bit(8));
  for (let index = 9; index < 15; index += 1) set(14 - index, 8, bit(index));
  for (let index = 0; index < 8; index += 1) set(size - 1 - index, 8, bit(index));
  for (let index = 8; index < 15; index += 1) set(8, size - 15 + index, bit(index));
  set(8, size - 8, true);
  if (spec.version >= 7) {
    const encodedVersion = versionBits(spec.version);
    for (let index = 0; index < 18; index += 1) {
      const value = ((encodedVersion >>> index) & 1) !== 0;
      const first = size - 11 + (index % 3);
      const second = Math.floor(index / 3);
      set(first, second, value);
      set(second, first, value);
    }
  }
}

function drawCodewords(matrix, codewords, mask) {
  const { modules, functions } = matrix;
  const size = modules.length;
  let bitIndex = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vertical = 0; vertical < size; vertical += 1) {
      const upward = ((right + 1) & 2) === 0;
      const y = upward ? size - 1 - vertical : vertical;
      for (let offset = 0; offset < 2; offset += 1) {
        const x = right - offset;
        if (functions[y][x]) continue;
        const raw = bitIndex < codewords.length * 8
          ? ((codewords[bitIndex >>> 3] >>> (7 - (bitIndex & 7))) & 1) !== 0
          : false;
        modules[y][x] = raw !== maskBit(mask, x, y);
        bitIndex += 1;
      }
    }
  }
}

export function normalizeQrSize(size = "30x30") {
  const numbers = String(size).match(/\d+/g);
  return numbers?.length >= 2 ? `${numbers[0]}x${numbers[1]}` : "30x30";
}

export function buildQrPayload({ athleteName, countryCode, size } = {}) {
  const name = String(athleteName || "NUMELE TĂU").trim().toLocaleUpperCase("ro-RO");
  const code = String(countryCode || "ROU").trim().slice(0, 3).toUpperCase();
  return `NSPORT|FRJ|NAME=${name}|COUNTRY=${code}|SIZE=${normalizeQrSize(size)}`;
}

export function createQrMatrix(payload) {
  const bytes = new TextEncoder().encode(String(payload));
  const spec = selectSpec(bytes.length);
  const data = dataCodewords(bytes, spec);
  const codewords = interleaveWithErrorCorrection(data, spec);
  const size = spec.version * 4 + 17;
  const matrix = createEmptyMatrix(size);
  const mask = 0;
  drawFunctionPatterns(matrix, spec, mask);
  drawCodewords(matrix, codewords, mask);
  return matrix.modules;
}

export function qrPathData(matrix, quietZone = 4) {
  const commands = [];
  matrix.forEach((row, y) => row.forEach((dark, x) => {
    if (dark) commands.push(`M${x + quietZone} ${y + quietZone}h1v1h-1z`);
  }));
  return commands.join("");
}
