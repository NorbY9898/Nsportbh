import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const root = join(process.cwd(), "public");
const port = Number(process.argv[2] || process.env.PORT || 4173);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8" };

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  const safe = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  let path = join(root, safe === "/" ? "index.html" : safe);
  try { if (statSync(path).isDirectory()) path = join(path, "index.html"); }
  catch { path = join(root, "404.html"); response.statusCode = 404; }
  response.setHeader("Content-Type", types[extname(path)] || "application/octet-stream");
  response.setHeader("Cache-Control", "no-store");
  createReadStream(path).pipe(response);
}).listen(port, "127.0.0.1", () => console.log(`NSPORT preview: http://127.0.0.1:${port}`));
