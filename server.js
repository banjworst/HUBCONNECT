// server.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('./Hub Connect/config/db');

const PORT = 3000;

const server = http.createServer(async (req, res) => {
  console.log('Request URL:', req.url);

  //Check if it is an API request
  if (req.url.startsWith('/api/')) {

    if (req.url === '/api/clubs' && req.method === 'GET') {
      try {
        const [clubs] = await db.query('SELECT * FROM clubs');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(clubs));
        
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Database query failed' }));
      }
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'API endpoint not found' }));
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
