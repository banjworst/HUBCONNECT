// viewEvents.js
// Feature: View events for HubConnect
// Author: Jayden

const mysql = require('mysql2');

// MySQL connection to Cloud SQL
const connection = mysql.createConnection({
  host: '34.26.213.135',
  user: 'jayden',
  password: 'Hubconn-3',
  database: 'testInstallation',
  port: 3306
});

// Connect to DB
connection.connect((err) => {
  if (err) {
    console.error("Connection error:", err);
    return;
  }
  console.log("Connected to MySQL: View Events");
});

// Query: Fetch upcoming events
const query = `
    SELECT event_id, title, date_time, description
    FROM Event
    ORDER BY date_time ASC;
`;

connection.query(query, (err, results) => {
  if (err) {
    console.error("Error pulling events:", err);
    return;
  }

  if (results.length === 0) {
    console.log("⚠️ No events found.");
  } else {
    console.log("\n📅 Upcoming Events:\n");

    results.forEach(event => {
      console.log(`------------------------`);
      console.log(`Event:       ${event.title}`);
      console.log(`Date & Time: ${event.date_time}`);
      console.log(`Description: ${event.description}`);
    });

    console.log(`------------------------`);
  }

  connection.end();
});
