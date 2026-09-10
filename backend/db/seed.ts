import { Client } from 'pg';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function seed() {
  const headAdminEmail = process.env.HEAD_ADMIN_EMAIL;
  const headAdminPassword = process.env.HEAD_ADMIN_PASSWORD;
  const dbUrl = process.env.DATABASE_URL;

  if (!headAdminEmail || !headAdminPassword) {
    console.error('Error: HEAD_ADMIN_EMAIL and HEAD_ADMIN_PASSWORD must be provided in .env');
    process.exit(1);
  }

  const client = new Client(
    dbUrl
      ? { connectionString: dbUrl }
      : {
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          database: process.env.DB_NAME || 'mivc_db',
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || '',
        }
  );

  try {
    await client.connect();
    console.log('Connected to database.');

    // Check if head admin already exists
    const res = await client.query('SELECT * FROM head_admins WHERE email = $1', [headAdminEmail]);
    
    if (res.rows.length > 0) {
      console.log(`Head admin with email ${headAdminEmail} already exists. Skipping seed.`);
    } else {
      console.log(`Creating head admin with email ${headAdminEmail}...`);
      
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(headAdminPassword, saltRounds);

      await client.query(`
        INSERT INTO head_admins (email, password_hash, full_name, is_active)
        VALUES ($1, $2, 'Head Administrator', true)
      `, [headAdminEmail, passwordHash]);
      
      console.log('Head admin created successfully.');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

seed();
