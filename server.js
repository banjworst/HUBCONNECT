// server.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const server = http.createServer((req, res) => {
  console.log('Request URL:', req.url);

  if (req.url.startsWith('/api/')) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({message: 'API endpoint'}));
    return;
  }

  // Default to index.html
  let filePath = req.url === '/' ? 'index.html' : req.url.substring(1);

  // Resolve the absolute path
  filePath = path.resolve(__dirname, filePath);

  // Get file extension
  const extname = path.extname(filePath);

  // Set content type
  let contentType = 'text/html';
  if (extname === '.css') contentType = 'text/css';
  else if (extname === '.js') contentType = 'text/javascript';

  // Read the file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found!');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
