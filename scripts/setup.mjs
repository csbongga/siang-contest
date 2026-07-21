import { createClient } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// โหลด .env
dotenv.config();
dotenv.config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  if (!process.env.POSTGRES_URL) {
    console.error('❌ ไม่พบ POSTGRES_URL ใน Environment Variables');
    process.exit(1);
  }

  const client = createClient();
  await client.connect();

  try {
    const sqlFile = path.join(__dirname, '../db/schema.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('⏳ กำลังสร้างตารางและเพิ่มข้อมูล Seed...');
    await client.query(sql);
    console.log('✅ สร้างฐานข้อมูลสำเร็จ!');
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await client.end();
  }
}

main();
