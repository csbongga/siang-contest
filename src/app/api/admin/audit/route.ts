import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { rows } = await sql`SELECT * FROM score_audit ORDER BY created_at DESC LIMIT 100`;
    return NextResponse.json({ audits: rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch audits' }, { status: 500 });
  }
}
