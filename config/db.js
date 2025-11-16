const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST || '34.26.213.135',
    user: process.env.DB_USER || 'sanj',
    password: 'Hubconn-3'
    database: process.env.DB_NAME || 'hubconnect',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool.promise();
