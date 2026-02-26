
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function check() {
    try {
        const users = await sql`
      SELECT id, email, name, google_id FROM users
    `;
        console.log('Users in DB:', JSON.stringify(users, null, 2));
    } catch (err) {
        console.error('Error:', err);
    }
}

check();
