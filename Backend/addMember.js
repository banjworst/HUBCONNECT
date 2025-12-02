// addMember.js
// Feature: Add member to a club for HubConnect
// Author: Jayden

const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: '34.26.213.135',
  user: 'jayden',
  password: 'Hubconn-3',
  database: 'testInstallation',
  port: 3306
});

// Demo data – change these values when testing
const MEMBER_NAME = 'New Member';
const MEMBER_EMAIL = 'newmember@example.com';
const CLUB_ID = 1;

connection.connect((err) => {
  if (err) {
    console.error('Connection error:', err);
    return;
  }

  console.log('Connected to MySQL: Add Member');

  // 1) Insert into User table
  const insertUserSql = `
    INSERT INTO User (name, email)
    VALUES (?, ?);
  `;

  connection.query(insertUserSql, [MEMBER_NAME, MEMBER_EMAIL], (err, result) => {
    if (err) {
      console.error('Error inserting user:', err);
      connection.end();
      return;
    }

    const newUserId = result.insertId;
    console.log('New user created with ID:', newUserId);

    // 2) Insert into Membership table
    // (includes status column = 'active')
    const insertMembershipSql = `
      INSERT INTO Membership (user_id, club_id, join_date, status)
      VALUES (?, ?, NOW(), 'active');
    `;

    connection.query(insertMembershipSql, [newUserId, CLUB_ID], (err2) => {
      if (err2) {
        console.error('Error inserting membership:', err2);
      } else {
        console.log(`Member successfully added to club ${CLUB_ID}!`);
      }

      connection.end();
    });
  });
});
