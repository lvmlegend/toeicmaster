const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3650;
const ROOT_DIR = __dirname;
const WEB_DIR = path.join(ROOT_DIR, 'web');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.zip': 'application/zip'
};

function serveFileWithRange(req, res, filePath) {
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;

      if (start >= stat.size || end >= stat.size) {
        res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
        res.end();
        return;
      }

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
        'Content-Type': contentType
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Accept-Ranges': 'bytes',
        'Content-Type': contentType
      });
      fs.createReadStream(filePath).pipe(res);
    }
  });
}

const server = http.createServer((req, res) => {
  try {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let pathname = decodeURIComponent(parsedUrl.pathname);

    if (pathname.startsWith('/files/')) {
      pathname = '/' + pathname.slice('/files/'.length);
    }

    const relPath = pathname === '/' ? '/index.html' : pathname;

    // 1. Check in WEB_DIR first for web assets
    const webCandidate = path.normalize(path.join(WEB_DIR, relPath));
    if (webCandidate.startsWith(WEB_DIR) && fs.existsSync(webCandidate) && fs.statSync(webCandidate).isFile()) {
      serveFileWithRange(req, res, webCandidate);
      return;
    }

    // 2. Check in ROOT_DIR (for PDFs, MP3s, root GitHub Pages files)
    const rootCandidate = path.normalize(path.join(ROOT_DIR, relPath));
    if (rootCandidate.startsWith(ROOT_DIR) && fs.existsSync(rootCandidate) && fs.statSync(rootCandidate).isFile()) {
      serveFileWithRange(req, res, rootCandidate);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Internal Server Error: ' + e.message);
  }
});

server.listen(PORT, () => {
  console.log(`🌸 Sakura TOEIC 650+ Academy đang chạy tại: http://localhost:${PORT}`);
});
