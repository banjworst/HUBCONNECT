// server.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('./config/db');
const PORT = 80;

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

    if (req.url.startsWith('/api/clubs/') && req.method === 'PUT') {
      const clubId = req.url.split('/')[3];
      let body = '';

      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const clubData = JSON.parse(body);
          const query = 'UPDATE clubs SET club_name = ?, description = ? WHERE id = ?';
          await db.query(query, [clubData.club_name, clubData.description, clubId]);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Club updated' }));
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      return;
    }

    if (req.url.startsWith('/api/rosters/') && req.method === 'GET') {
      const clubId = req.url.split('/')[3];

      try {
        const query = `
        SELECT roster.roster_id, roster.member_name, roster.role 
        FROM roster 
        JOIN clubs ON roster.club_id = clubs.id 
        WHERE clubs.id = ?
        `;
        const [members] = await db.query(query, [clubId]);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(members));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
      return;
    }

    // api endpoint for Requesting to join a club
    if (req.url === '/api/roster' && req.method === 'POST') {
      let body = '';

      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const rosterData = JSON.parse(body);
          const query = 'INSERT INTO roster (user_id, club_id, join_date, mem_status) VALUES (?, ?, CURDATE(), ?)';
          const [result] = await db.query(query, [
            rosterData.user_id,
            rosterData.club_id,
            'pending'
          ]);
          
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ roster_id: result.insertId, message: 'Join request submitted' }));
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      return;
    }

    // PUT /api/roster/:roster_id - to update membership status (approve/reject)
    if (req.url.startsWith('/api/roster/') && req.method === 'PUT') {
      const rosterId = req.url.split('/')[3];
      let body = '';

      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const rosterData = JSON.parse(body);
          const query = 'UPDATE roster SET mem_status = ? WHERE roster_id = ?';
          await db.query(query, [rosterData.mem_status, rosterId]);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Membership status updated' }));
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      return;
    }

    // DELETE /api/roster/:roster_id - Remove member from club
    if (req.url.startsWith('/api/roster/') && req.method === 'DELETE') {
        const rosterId = req.url.split('/')[3];
    
        try {
            const query = 'DELETE FROM roster WHERE roster_id = ?';
            await db.query(query, [rosterId]);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Member removed from club' }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
        return;
    }

    // View RSVPs for an event
    if (req.url.startsWith('/api/rsvps/') && req.method === 'GET') {
      const eventId = req.url.split('/')[3];
      
      try {
        const query = `
        SELECT rsvp.rsvp_id, rsvp.user_id, rsvp.response 
        FROM rsvp
        JOIN users ON rsvp.user_id = users.id
        WHERE rsvp.event_id = ?
        `;
        
        const [rsvps] = await db.query(query, [eventId]);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(rsvps));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
      return;
    }

    // POST /api/rsvps - to RSVP to an event
    if (req.url === '/api/rsvps' && req.method === 'POST') {
      let body = '';

      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const rsvpData = JSON.parse(body);
          const query = 'INSERT INTO rsvps (event_id, user_id, rsvp_status) VALUES (?, ?, ?)';
          const [result] = await db.query(query, [
            rsvpData.event_id,
            rsvpData.user_id,
            rsvpData.rsvp_status // 'yes', 'no', 'maybe'
          ]);

          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ rsvp_id: result.insertId, message: 'RSVP recorded' }));
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      return;
    }

    // PUT /api/rsvps/:rsvp_id - to update RSVP status
    if (req.url.startsWith('/api/rsvps/') && req.method === 'PUT') {
      const rsvpId = req.url.split('/')[3];
      let body = '';

      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const rsvpData = JSON.parse(body);
          const query = 'UPDATE rsvps SET rsvp_status = ? WHERE rsvp_id = ?';
          await db.query(query, [rsvpData.rsvp_status, rsvpId]);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'RSVP status updated' }));
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      return;
    }

    // GET api/users/:user_id - view user profile
    if (req.url.startsWith('/api/users/') && req.method === 'GET') {
      const userId = req.url.split('/')[3];

      try {
        const query = 'SELECT user_id, name, email, role FROM users WHERE user_id = ?';
        const [users] = await db.query(query, [userId]);

        if (!users || users.length === 0) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'User not found' }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(users[0]));
        }
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
      return;
    }

    // POST /api/login - User login
    if (req.url === '/api/login' && req.method === 'POST') {
      let body = '';
      
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const loginData = JSON.parse(body);
          const query = 'SELECT user_id, name, email, role FROM users WHERE email = ? AND password_hash = ?';
          const [users] = await db.query(query, [loginData.email, loginData.password]);

          if (!users || users.length === 0) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid credentials' }));
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(users[0]));
          }
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

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});

