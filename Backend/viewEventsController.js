// Backend/viewEventsController.js
// Controller: View events for HubConnect
// Author: Jayden

module.exports = function makeViewEventsController(connection) {
  return function viewEvents(req, res) {
    const sql = `
      SELECT event_id, title, date_time, description
      FROM Event
      ORDER BY date_time ASC;
    `;

    connection.query(sql, (err, results) => {
      if (err) {
        console.error("ViewEvents error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      // If no events, still return a valid JSON array
      res.json(results);
    });
  };
};
