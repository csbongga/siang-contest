import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Authentication is handled by middleware
    
    // ล้างคะแนนทั้งหมด
    await sql`TRUNCATE TABLE scores`;
    await sql`TRUNCATE TABLE social_votes`;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to reset scores' }, { status: 500 });
  }
}
