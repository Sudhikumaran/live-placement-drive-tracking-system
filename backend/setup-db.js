const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function setupDatabase() {
    try {
        console.log('🔄 Connecting to Neon database...');

        const client = await pool.connect();
        console.log('✅ Connected successfully!');

        // Read schema file
        const schemaPath = path.join(__dirname, 'src', 'config', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('🔄 Running database schema...');

        // Execute schema
        await client.query(schema);

        console.log('✅ Database setup complete!');
        console.log('✅ All tables created successfully');
        console.log('✅ Default admin account created:');
        console.log('   Email: admin@college.edu');
        console.log('   Password: admin123');

        client.release();
        await pool.end();

        console.log('\n🚀 You can now start the backend with: npm run dev');
    } catch (error) {
        console.error('❌ Error setting up database:', error.message);
        process.exit(1);
    }
}

setupDatabase();
