const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Load environment variables
require('dotenv').config();

async function initializeDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: 'postgres', // Connect to default database first
  });

  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();
    console.log('Connected successfully!');

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'healthledger';
    const result = await client.query(`SELECT datname FROM pg_database WHERE datname = '${dbName}'`);
    
    if (result.rows.length === 0) {
      console.log(`Creating database: ${dbName}`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database ${dbName} created successfully!`);
    } else {
      console.log(`Database ${dbName} already exists.`);
    }

    await client.end();

    // Connect to the new database and run schema
    const dbClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: dbName,
    });

    console.log(`Connecting to ${dbName}...`);
    await dbClient.connect();
    console.log('Connected to database!');

    // Read and execute SQL schema
    const sqlPath = path.join(__dirname, 'init-db.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing database schema...');
    await dbClient.query(sql);
    console.log('Database schema initialized successfully!');

    await dbClient.end();
    console.log('\n✅ Database setup complete!');
    console.log('\nDefault credentials:');
    console.log('Email: admin@healthledger.org');
    console.log('Password: admin123');
    console.log('\n⚠️  Please change the default password after first login!');

  } catch (error) {
    console.error('Error initializing database:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };