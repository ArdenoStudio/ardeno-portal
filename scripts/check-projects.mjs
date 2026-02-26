
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function check() {
    try {
        const projects = await sql`
      SELECT p.id, p.project_name, p.current_stage, p.current_status, u.email as client_email, p.user_id
      FROM projects p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `;
        console.log('Projects in DB:', JSON.stringify(projects, null, 2));
    } catch (err) {
        console.error('Error:', err);
    }
}

check();
