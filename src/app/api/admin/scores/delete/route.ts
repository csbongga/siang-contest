import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { judge_id, team_id, reason } = await request.json();

    if (!judge_id || !team_id || !reason) {
      return NextResponse.json({ error: 'Missing parameters or reason' }, { status: 400 });
    }

    const stateRes = await sql`SELECT is_finalized FROM system_state WHERE id = 1`;
    if (stateRes.rows.length > 0 && stateRes.rows[0].is_finalized) {
      return NextResponse.json({ error: 'ผลการแข่งขันถูกล็อกแล้ว' }, { status: 403 });
    }

    const existingRes = await sql`SELECT * FROM scores WHERE judge_id = ${judge_id} AND team_id = ${team_id}`;
    const existing = existingRes.rows[0];

    if (!existing) {
      return NextResponse.json({ error: 'ไม่พบคะแนนนี้ในระบบ' }, { status: 404 });
    }

    await sql`DELETE FROM scores WHERE judge_id = ${judge_id} AND team_id = ${team_id}`;

    await sql`
      INSERT INTO score_audit (judge_id, team_id, action, actor, before_data, after_data, reason)
      VALUES (${judge_id}, ${team_id}, 'delete', 'admin', ${JSON.stringify(existing)}, null, ${reason})
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete score' }, { status: 500 });
  }
}
