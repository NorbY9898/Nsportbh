import { writeFile } from "node:fs/promises";
import { createQrMatrix } from "../public/assets/js/qr-code.js";

const [payload, outputPath] = process.argv.slice(2);
if (!payload || !outputPath) throw new Error("Usage: node scripts/export-qr-matrix.mjs <payload> <output.json>");
await writeFile(outputPath, JSON.stringify(createQrMatrix(payload)), "utf8");
