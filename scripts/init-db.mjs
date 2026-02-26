import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.DATABASE_URL;
if (!url) {
    console.error('DATABASE_URL is not set in .env');
    process.exit(1);
}

const sql = neon(url);

async function init() {
    try {
        console.log('Connecting to Neon...');
        const schemaPath = path.resolve('netlify/functions/db/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Running schema.sql statements...');

        // Very simple split by semicolon that doesn't care about $$
        // But since DO $$ BEGIN ... END $$; ends with a semicolon, 
        // and tables end with semicolons, we can try splitting and filtering empty blocks.
        // To handle $$ blocks, we can use a slightly more clever regex.
        const statements = schemaSql
            .split(/;(?=(?:[^$]*\$\$[^$]*\$\$)*[^$]*$)/)
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            console.log('Executing:', statement.substring(0, 50) + '...');
            await sql(statement);
        }

        console.log('Database initialized successfully!');
    } catch (err) {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    }
}

init();
