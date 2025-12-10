const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('./config/db');
const crypto = require('crypto');
const makeAddMemberController = require('./Backend/addMemberController');
const makeViewEventsController = require('./Backend/viewEventsController');

// Create controller handler functions by injecting DB connection
const addMemberController = makeAddMemberController(db);
const viewEventsController = makeViewEventsController(db);

const PORT = 80;

// IN-MEMORY SESSION STORE
const SESSIONS = {};

function parseCookies(request) {
    const list = {}, rc = request.headers.cookie;
    rc && rc.split(';').forEach(function(cookie) {
        const parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
    return list;
}

const server = http.createServer(async (req, res) => {
  console.log(`${req.method} Request: ${req.url}`);
  const urlParts = new URL(req.url, `http://${req.headers.host}`);
  const pathname = urlParts.pathname;

  if (pathname.startsWith('/api/')) {

    // ==========================================
    // 0. AUTH API
    // ==========================================

    // GET /api/me (Check Session)
    if (pathname === '/api/me' && req.method === 'GET') {
        const cookies = parseCookies(req);
        const sessionId = cookies.hub_session;
        if (!sessionId || !SESSIONS[sessionId]) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not logged in' }));
            return;
        }
        try {
            const userId = SESSIONS[sessionId].userId;
            const [users] = await db.query('SELECT user_id, full_name, email FROM users WHERE user_id = ?', [userId]);
            if (users.length === 0) { res.writeHead(401); res.end(JSON.stringify({ error: 'User not found' })); return; }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ user: users[0] }));
        } catch (err) { res.writeHead(500); res.end(JSON.stringify({ error: 'Server Error' })); }
        return;
    }

    // PUT /api/me (Update Profile + Sync Roster)
    if (pathname === '/api/me' && req.method === 'PUT') {
        const cookies = parseCookies(req);
        const sessionId = cookies.hub_session;
        if (!sessionId || !SESSIONS[sessionId]) {
            res.writeHead(401); res.end(JSON.stringify({ error: 'Not logged in' }));
            return;
        }
        const userId = SESSIONS[sessionId].userId;

        let body = ''; req.on('data', c => body += c);
        req.on('end', async () => {
            try {
                const { name, email, password } = JSON.parse(body);
                
                const [currentUser] = await db.query('SELECT full_name FROM users WHERE user_id = ?', [userId]);
                if (currentUser.length === 0) { res.writeHead(404); res.end(JSON.stringify({ error: 'User not found' })); return; }
                const oldName = currentUser[0].full_name;

                let query = 'UPDATE users SET full_name = ?, email = ?';
                let params = [name, email];

                if (password && password.trim() !== "") {
                    query += ', password = ?';
                    params.push(password);
                }

                query += ' WHERE user_id = ?';
                params.push(userId);

                await db.query(query, params);

                if (name !== oldName) {
                    await db.query('UPDATE roster SET member_name = ? WHERE member_name = ?', [name, oldName]);
                }
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Profile updated', user: { full_name: name, email: email } }));
            } catch (e) { 
                console.error(e);
                res.writeHead(500); res.end(JSON.stringify({ error: 'Update failed' })); 
            }
        });
        return;
    }

    // POST /api/login
    if (pathname === '/api/login' && req.method === 'POST') {
      let body = ''; req.on('data', c => body += c);
      req.on('end', async () => {
        try {
          const { email, password } = JSON.parse(body);
          const [users] = await db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
          if (users.length === 0) { res.writeHead(401); res.end(JSON.stringify({ error: 'Invalid credentials' })); return; }
          
          const sessionId = crypto.randomUUID();
          SESSIONS[sessionId] = { userId: users[0].user_id };
          res.writeHead(200, { 'Content-Type': 'application/json', 'Set-Cookie': `hub_session=${sessionId}; HttpOnly; Path=/; Max-Age=86400` });
          res.end(JSON.stringify({ message: 'Login successful' }));
        } catch (e) { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); }
      });
      return;
    }

    // POST /api/register
    if (pathname === '/api/register' && req.method === 'POST') {
      let body = ''; req.on('data', c => body += c);
      req.on('end', async () => {
        try {
          const { name, email, password } = JSON.parse(body);
          const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
          if (existing.length > 0) { res.writeHead(409); res.end(JSON.stringify({ error: 'Email exists' })); return; }
          
          const [result] = await db.query('INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)', [name, email, password]);
          const sessionId = crypto.randomUUID();
          SESSIONS[sessionId] = { userId: result.insertId };
          res.writeHead(201, { 'Content-Type': 'application/json', 'Set-Cookie': `hub_session=${sessionId}; HttpOnly; Path=/; Max-Age=86400` });
          res.end(JSON.stringify({ message: 'Created' }));
        } catch (e) { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); }
      });
      return;
    }

    // POST /api/logout
    if (pathname === '/api/logout' && req.method === 'POST') {
        const cookies = parseCookies(req);
        if (cookies.hub_session) delete SESSIONS[cookies.hub_session];
        res.writeHead(200, { 'Content-Type': 'application/json', 'Set-Cookie': `hub_session=; HttpOnly; Path=/; Max-Age=0` });
        res.end(JSON.stringify({ message: 'Logged out' }));
        return;
    }

    // ==========================================
    // 1. CLUBS API
    // ==========================================
    if (pathname === '/api/clubs' && req.method === 'GET') {
      try { const [rows] = await db.query('SELECT * FROM clubs'); res.writeHead(200); res.end(JSON.stringify(rows)); }
      catch (e) { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); }
      return;
    }
    if (pathname === '/api/clubs' && req.method === 'POST') {
      let body = ''; req.on('data', c => body += c);
      req.on('end', async () => {
        try {
            const { club_name, description, category, icon_letter, created_by } = JSON.parse(body);
            const [resInfo] = await db.query('INSERT INTO clubs (club_name, description, category, icon_letter) VALUES (?,?,?,?)', [club_name, description, category, icon_letter]);
            if (created_by) await db.query('INSERT INTO roster (club_id, member_name, role, mem_status) VALUES (?,?,?,?)', [resInfo.insertId, created_by, 'Officer', 'active']);
            res.writeHead(201); res.end(JSON.stringify({ id: resInfo.insertId }));
        } catch (e) { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); }
      });
      return;
    }
    if (pathname.startsWith('/api/clubs/') && req.method === 'PUT') {
        const id = pathname.split('/')[3];
        let body = ''; req.on('data', c => body += c);
        req.on('end', async () => {
            try {
                const { club_name, description, category, icon_letter } = JSON.parse(body);
                await db.query('UPDATE clubs SET club_name=?, description=?, category=?, icon_letter=? WHERE club_id=?', [club_name, description, category, icon_letter, id]);
                res.writeHead(200); res.end(JSON.stringify({ message: 'Updated' }));
            } catch (e) { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); }
        });
        return;
    }

    // ==========================================
    // 2. EVENTS API
    // ==========================================
if (pathname === '/api/events' && req.method === 'GET') {
  // Use viewEvents controller
  return viewEventsController(req, res);
 }

    if (pathname.startsWith('/api/events/') && req.method === 'DELETE') {
        const id = pathname.split('/')[3];
        try { await db.query('DELETE FROM events WHERE event_id=?', [id]); res.writeHead(200); res.end(JSON.stringify({ message: 'Deleted' })); }
        catch (e) { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); }
        return;
    }

    // ==========================================
    // 3. ROSTER API
    // ==========================================
    if (pathname.startsWith('/api/rosters/') && req.method === 'GET') {
      const id = pathname.split('/')[3];
      try {
        const sql = id === 'all' ? 'SELECT * FROM roster' : 'SELECT * FROM roster WHERE club_id = ?';
        const [rows] = await db.query(sql, id === 'all' ? [] : [id]);
        res.writeHead(200); res.end(JSON.stringify(rows));
      } catch (e) { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); }
      return;
    }
    if (pathname === '/api/rosters' && req.method === 'POST') {
  // Use your addMember controller
  return addMemberController(req, res);
}

    if (pathname.startsWith('/api/rosters/') && req.method === 'PUT') {
        const id = pathname.split('/')[3];
        let body = ''; req.on('data', c => body += c);
        req.on('end', async () => {
            try {
                const { mem_status } = JSON.parse(body);
                await db.query('UPDATE roster SET mem_status=? WHERE roster_id=?', [mem_status, id]);
                res.writeHead(200); res.end(JSON.stringify({ message: 'Updated' }));
            } catch (e) { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); }
        });
        return;
    }

    // ==========================================
    // 4. RSVP API
    // ==========================================
    if (pathname === '/api/rsvps' && req.method === 'POST') {
        const cookies = parseCookies(req);
        const sessionId = cookies.hub_session;
        if (!sessionId || !SESSIONS[sessionId]) { res.writeHead(401); res.end(JSON.stringify({ error: 'Not logged in' })); return; }
        const userId = SESSIONS[sessionId].userId;

        let body = ''; req.on('data', c => body += c);
        req.on('end', async () => {
            try {
                const { event_id } = JSON.parse(body);
                const [existing] = await db.query('SELECT * FROM rsvps WHERE event_id=? AND user_id=?', [event_id, userId]);
                
                if (existing.length > 0) {
                    await db.query('DELETE FROM rsvps WHERE rsvp_id=?', [existing[0].rsvp_id]);
                    res.writeHead(200); res.end(JSON.stringify({ status: 'removed' }));
                } else {
                    await db.query('INSERT INTO rsvps (event_id, user_id, rsvp_status) VALUES (?, ?, ?)', [event_id, userId, 'yes']);
                    res.writeHead(201); res.end(JSON.stringify({ status: 'added' }));
                }
            } catch (e) { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); }
        });
        return;
    }
    if (pathname.startsWith('/api/rsvps/') && req.method === 'GET') {
        const eventId = pathname.split('/')[3];
        try {
            const query = `SELECT r.user_id, u.full_name FROM rsvps r JOIN users u ON r.user_id = u.user_id WHERE r.event_id = ?`;
            const [rows] = await db.query(query, [eventId]);
            res.writeHead(200); res.end(JSON.stringify(rows));
        } catch (e) { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); }
        return;
    }

    res.writeHead(404); res.end(JSON.stringify({ error: 'Not Found' }));
    return;
  }

  // ==========================================
  // STATIC FILES
  // ==========================================
  let filePath = pathname === '/' ? 'index.html' : pathname.substring(1);
  filePath = path.resolve(__dirname, filePath);
  const ext = path.extname(filePath);
  const map = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript' };
  
  fs.readFile(filePath, (err, content) => {
    if (err) { res.writeHead(404); res.end('404'); } 
    else { res.writeHead(200, { 'Content-Type': map[ext] || 'text/plain' }); res.end(content); }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on Port ${PORT}`);
});
