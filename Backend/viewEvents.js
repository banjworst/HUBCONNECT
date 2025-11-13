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

connection.connect((err) => {
  if (err) {
    console.log('Connection error:', err);
    return;
  }

  console.log('Connected to MySQL: View Events');

  const query = `
    SELECT event_id, title, date_time, description
    FROM Event
    ORDER BY date_time ASC;
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.log('Error pulling events:', err);
      connection.end();
      return;
    }

    console.log('\nUpcoming Events:\n');

    if (results.length === 0) {
      console.log("No events found.");
    } else {
      results.forEach(ev => {
        console.log(`${ev.event_id} | ${ev.title} | ${ev.date_time}`);
        if (ev.description) console.log("  " + ev.description);
        console.log("----------------------");
      });
    }

    connection.end();
  });
});
