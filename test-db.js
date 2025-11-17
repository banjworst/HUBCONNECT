const db = require('./config/db');

async function testConnection() {
    try {
        console.log('Testing database connection...');

        const [rows] = await db.query('SELECT * FROM clubs');

        console.log('Connection successful');
        console.log('Clubs in database:', rows);

        process.exit(0);
    } catch (error) {
        console.error('Error connecting to the database:', error);
        process.exit(1);
    }
}

testConnection();