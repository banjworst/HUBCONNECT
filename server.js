// server.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('./config/db');

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

    // POST /api/clubs to add a new club
    if (req.url === '/api/clubs' && req.method === 'POST') {
      let body = '';
      
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          const clubData = JSON.parse(body);
          const query = 'INSERT INTO clubs (club_name, description) VALUES (?, ?)';
          const [result] = await db.query(query, [clubData.club_name, clubData.description]);

          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ id: result.insertId, message: 'Club created' }));
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      return;
    }

    // GET /api/events to fetch all events
    if (req.url === '/api/events' && req.method === 'GET') {
      try {
        const [events] = await db.query('SELECT * FROM events');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(events));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error }));
      }
      return;
    }

    // POST /api/events to add a new event
    if (req.url === '/api/events' && req.method === 'POST') {
      let body = '';
      
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          const eventData = JSON.parse(body);
          const query = 'INSERT INTO events (club_id, event_title, description, event_date, location, created_by) VALUES (?, ?, ?, ?, ?, ?)';
          const [result] = await db.query(query, [
            eventData.club_id,
            eventData.event_title,
            eventData.description,
            eventData.event_date,
            eventData.location,
            eventData.created_by
          ]);

          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ id: result.insertId, message: 'Event created' }));
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      return;
    }


    // If no matching API route found
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
