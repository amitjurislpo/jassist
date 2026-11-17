// Minimal static file server for the J Assist site (no dependencies).
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3006;
const ROOT = path.join(__dirname, 'public');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

// Same permanent redirects as vercel.json (301, query string kept, single hop).
const REDIRECTS = {
  '/why-j-assist': '/why-jurisassistme',
  '/services/sales-lead-generation': '/services',
  '/services/real-estate-support': '/industries/real-estate'
};

http.createServer((req, res) => {
  const [rawPath, ...q] = req.url.split('?');
  const qs = q.length ? '?' + q.join('?') : '';
  // Match Vercel: strip trailing slash and .html with a single 301 hop, keeping the query string.
  let clean = rawPath;
  if (clean.length > 1 && clean.endsWith('/')) clean = clean.replace(/\/+$/, '') || '/';
  if (clean === '/index.html') clean = '/';
  else if (clean.endsWith('.html')) clean = clean.slice(0, -5);
  if (clean.endsWith('/index')) clean = clean.slice(0, -6) || '/';
  if (clean !== rawPath) {
    res.writeHead(301, { Location: (REDIRECTS[clean] || clean) + qs });
    return res.end();
  }
  const rp = rawPath.length > 1 ? rawPath.replace(/\/$/, '') : rawPath;
  if (REDIRECTS[rp]) {
    res.writeHead(301, { Location: REDIRECTS[rp] + qs });
    return res.end();
  }
  let urlPath;
  try { urlPath = decodeURIComponent(req.url.split('?')[0]); } catch { urlPath = '/'; }
  if (urlPath.endsWith('/')) urlPath += 'index.html';
  let file = path.normalize(path.join(ROOT, urlPath));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  // Clean URLs: /services -> services.html
  if (!path.extname(file)) file += '.html';
  fs.readFile(file, (err, data) => {
    if (err) {
      // Unknown URL: send the branded 404 page with a real 404 status.
      return fs.readFile(path.join(ROOT, '404.html'), (e2, page) => {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex' });
        res.end(e2 ? '404 Not Found' : page);
      });
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => console.log(`JurisAssistMe running at http://localhost:${PORT}`));
