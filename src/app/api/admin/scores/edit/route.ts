import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { judge_id, team_id, c1, c2, c3, c4, c5, c6, c7, note, reason } = body;

    if (!judge_id || !team_id || !reason) {
      return NextResponse.json({ error: 'Missing parameters or reason' }, { status: 400 });
    }

    const stateRes = await sql`SELECT is_finalized FROM system_state WHERE id = 1`;
    if (stateRes.rows.length > 0 && stateRes.rows[0].is_finalized) {
      return NextResponse.json({ error: 'ผลการแข่งขันถูกล็อกแล้ว' }, { status: 403 });
    }

    const existingRes = await sql`SELECT * FROM scores WHERE judge_id = ${judge_id} AND team_id = ${team_id}`;
    const existing = existingRes.rows[0];

    // Validate ให้อยู่ในช่วงคะแนน
    const validC1 = Math.min(Math.max(Number(c1) || 0, 0), 20);
    const validC2 = Math.min(Math.max(Number(c2) || 0, 0), 20);
    const validC3 = Math.min(Math.max(Number(c3) || 0, 0), 15);
    const validC4 = Math.min(Math.max(Number(c4) || 0, 0), 15);
    const validC5 = Math.min(Math.max(Number(c5) || 0, 0), 15);
    const validC6 = Math.min(Math.max(Number(c6) || 0, 0), 10);
    const validC7 = Math.min(Math.max(Number(c7) || 0, 0), 5);
    const noteText = note || '';

    let action = 'admin_edit';
    if (!existing) {
      // แอดมินกรอกแทน
      action = 'admin_entry';
      await sql`
        INSERT INTO scores (judge_id, team_id, c1, c2, c3, c4, c5, c6, c7, note, updated_at, submitted_at, is_locked, entered_by, edited_by_admin)
        VALUES (${judge_id}, ${team_id}, ${validC1}, ${validC2}, ${validC3}, ${validC4}, ${validC5}, ${validC6}, ${validC7}, ${noteText}, now(), now(), true, 'admin', false)
      `;
    } else {
      await sql`
        UPDATE scores 
        SET c1 = ${validC1}, c2 = ${validC2}, c3 = ${validC3}, c4 = ${validC4}, c5 = ${validC5}, c6 = ${validC6}, c7 = ${validC7}, note = ${noteText}, updated_at = now(), edited_by_admin = true
        WHERE judge_id = ${judge_id} AND team_id = ${team_id}
      `;
    }

    const afterData = { c1: validC1, c2: validC2, c3: validC3, c4: validC4, c5: validC5, c6: validC6, c7: validC7, note: noteText, entered_by: existing ? existing.entered_by : 'admin', edited_by_admin: !!existing };

    await sql`
      INSERT INTO score_audit (judge_id, team_id, action, actor, before_data, after_data, reason)
      VALUES (${judge_id}, ${team_id}, ${action}, 'admin', ${existing ? JSON.stringify(existing) : null}, ${JSON.stringify(afterData)}, ${reason})
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to edit score' }, { status: 500 });
  }
}
