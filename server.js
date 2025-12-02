// server.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('./config/db'); // This now exists!
const PORT = 80;

const server = http.createServer(async (req, res) => {
  console.log(`${req.method} Request: ${req.url}`);

  // ==========================================
  // 1. API ROUTES
  // ==========================================
  
  // Helper to parse URL parts (ignores query strings like ?id=1)
  const urlParts = new URL(req.url, `http://${req.headers.host}`);
  const pathname = urlParts.pathname;

  if (pathname.startsWith('/api/')) {

    // --- CLUBS API ---

    // GET /api/clubs
    if (pathname === '/api/clubs' && req.method === 'GET') {
      try {
        const [clubs] = await db.query('SELECT * FROM clubs');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(clubs));
      } catch (error) {
        console.error(error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Database query failed' }));
      }
      return;
    }

    // POST /api/clubs
    if (pathname === '/api/clubs' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', async () => {
        try {
          const { club_name, description, category, icon_letter } = JSON.parse(body);
          // Assuming your table has these columns. Adjust if different.
          const query = 'INSERT INTO clubs (club_name, description, category, icon_letter) VALUES (?, ?, ?, ?)';
          const [result] = await db.query(query, [club_name, description, category, icon_letter]);
          
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ id: result.insertId, message: 'Club created' }));
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      return;
    }

    // --- EVENTS API ---

    // GET /api/events
    if (pathname === '/api/events' && req.method === 'GET') {
      try {
        const [events] = await db.query('SELECT * FROM events');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(events));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
      return;
    }

    // POST /api/events
    if (pathname === '/api/events' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', async () => {
        try {
          const eventData = JSON.parse(body);
          const query = 'INSERT INTO events (club_id, event_title, description, event_date, event_time, location, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)';
          const [result] = await db.query(query, [
            eventData.club_id,
            eventData.event_title,
            eventData.description,
            eventData.event_date,
            eventData.event_time, // Added time field
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

    // DELETE /api/events/:id
    if (pathname.startsWith('/api/events/') && req.method === 'DELETE') {
        const eventId = pathname.split('/')[3];
        try {
            await db.query('DELETE FROM events WHERE event_id = ?', [eventId]);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Event deleted' }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
        return;
    }

    // 404 for unknown API routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'API endpoint not found' }));
    return;
  }

  // ==========================================
  // 2. STATIC FILE SERVING (HTML, CSS, JS)
  // ==========================================
  
  // Default to index.html if asking for root "/"
  let filePath = pathname === '/' ? 'index.html' : pathname.substring(1);
  
  // Resolve absolute path
  filePath = path.resolve(__dirname, filePath);

  // Get extension for Content-Type
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  if (extname === '.css') contentType = 'text/css';
  if (extname === '.js') contentType = 'text/javascript';
  if (extname === '.png') contentType = 'image/png';
  if (extname === '.jpg') contentType = 'image/jpeg';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found
        res.writeHead(404);
        res.end('404 File Not Found');
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
