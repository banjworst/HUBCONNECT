// addMember.js
// Feature: Add Member for HubConnect
// Author: Jayden

const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: '34.26.213.135',
  user: 'jayden',
  password: 'Hubconn-3',
  database: 'testInstallation',
  port: 3306
});

// CHANGE THESE TO TEST
const NAME = "New Member";
const EMAIL = "newmember@example.com";
const CLUB_ID = 1;

connection.connect((err) => {
  if (err) {
    console.log("Connection error:", err);
    return;
  }

  console.log("Connected to MySQL: Add Member");

  const addUserSQL = `
    INSERT INTO User (name, email)
    VALUES (?, ?)
  `;

  connection.query(addUserSQL, [NAME, EMAIL], (err, result) => {
    if (err) {
      console.log("User insert error:", err);
      connection.end();
      return;
    }

    const newUserID = result.insertId;
    console.log("New user created with ID:", newUserID);

    const addMembershipSQL = `
      INSERT INTO Membership (user_id, club_id, join_date, status)
      VALUES (?, ?, NOW(), 'active')
    `;

    connection.query(addMembershipSQL, [newUserID, CLUB_ID], (err2) => {
      if (err2) {
        console.log("Membership insert error:", err2);
      } else {
        console.log("Member successfully added to the club!");
      }

      connection.end();
    });
  });
});
