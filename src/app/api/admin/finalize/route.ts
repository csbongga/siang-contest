import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { rows } = await sql`SELECT is_finalized, finalized_at FROM system_state WHERE id = 1`;
    return NextResponse.json({ state: rows[0] || { is_finalized: false } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch system state' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { is_finalized } = await request.json();

    if (typeof is_finalized !== 'boolean') {
      return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
    }

    await sql`
      INSERT INTO system_state (id, is_finalized, finalized_at)
      VALUES (1, ${is_finalized}, ${is_finalized ? new Date().toISOString() : null})
      ON CONFLICT (id) DO UPDATE 
      SET is_finalized = ${is_finalized}, finalized_at = ${is_finalized ? new Date().toISOString() : null}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to set finalize state' }, { status: 500 });
  }
}
