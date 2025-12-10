// Backend/addMemberController.js
// Controller: Add member to a club for HubConnect
// Author: Jayden

module.exports = function makeAddMemberController(db) {
  return function addMember(req, res) {
    let body = '';

    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', async () => {
      try {
        const { club_id, member_name } = JSON.parse(body);

        if (!club_id || !member_name) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'club_id and member_name are required' }));
          return;
        }

        // Match the existing roster table your project already uses
        await db.query(
          'INSERT INTO roster (club_id, member_name, role, mem_status) VALUES (?,?,?,?)',
          [club_id, member_name, 'Member', 'pending']
        );

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Member successfully added to club' }));
      } catch (err) {
        console.error('AddMember error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to add member' }));
      }
    });
  };
};
