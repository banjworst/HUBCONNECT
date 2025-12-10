// Backend/viewEventsController.js
// Controller: View events for HubConnect
// Author: Jayden

module.exports = function makeViewEventsController(db) {
  return async function viewEvents(req, res) {
    try {
      // Match the existing events table the project is using
      const [rows] = await db.query(
        'SELECT * FROM events ORDER BY event_date ASC, event_time ASC'
      );

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(rows));
    } catch (err) {
      console.error('ViewEvents error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Database error' }));
    }
  };
};
