import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const judge_id = searchParams.get('judge_id');
    const team_id = searchParams.get('team_id');
    const all = searchParams.get('all');

    if (all === 'true') {
      // ดึงคะแนนทั้งหมด เพื่อใช้ในหน้า results (อนุญาตเฉพาะตอนแอดมินเรียก ซึ่งเดี๋ยวต้องดักที่ middleware หรือปล่อยให้ดึงไปก็ได้เพราะ middleware ปกป้อง route /api/admin/*) 
      // แต่เราควรตรวจสอบสิทธิ์ถ้ามันเกี่ยวกับข้อมูล sensitive
      const { rows } = await sql`SELECT * FROM scores`;
      return NextResponse.json({ scores: rows });
    }

    if (judge_id && team_id) {
      const { rows } = await sql`
        SELECT * FROM scores 
        WHERE judge_id = ${judge_id} AND team_id = ${team_id}
      `;
      return NextResponse.json({ score: rows[0] || null });
    }
    
    if (judge_id) {
      // คืนแค่ team_id + สถานะล็อก ห้ามมีตัวเลขคะแนนติดมา
      const { rows } = await sql`SELECT team_id, is_locked FROM scores WHERE judge_id = ${judge_id}`;
      return NextResponse.json({ 
        scored_teams: rows.map(r => r.team_id),
        locks: rows.reduce((acc, r) => ({ ...acc, [r.team_id]: r.is_locked }), {})
      });
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { judge_id, team_id, c1, c2, c3, c4, c5, c6, c7, note } = body;

    if (!judge_id || !team_id) {
      return NextResponse.json({ error: 'Missing judge_id or team_id' }, { status: 400 });
    }

    // 1. ตรวจสอบสถานะ Finalized
    const stateRes = await sql`SELECT is_finalized FROM system_state WHERE id = 1`;
    if (stateRes.rows.length > 0 && stateRes.rows[0].is_finalized) {
      return NextResponse.json({ error: 'ผลการแข่งขันถูกล็อกแล้ว ไม่สามารถแก้ไขได้' }, { status: 403 });
    }

    // 2. ตรวจสอบว่าถูกล็อกอยู่หรือไม่
    const existingRes = await sql`SELECT * FROM scores WHERE judge_id = ${judge_id} AND team_id = ${team_id}`;
    const existing = existingRes.rows[0];

    if (existing && existing.is_locked) {
      return NextResponse.json({ error: 'คะแนนนี้ถูกล็อกแล้ว กรุณาติดต่อแอดมินเพื่อปลดล็อก' }, { status: 409 });
    }

    // Validate ให้อยู่ในช่วงคะแนน
    const validC1 = Math.min(Math.max(Number(c1) || 0, 0), 20);
    const validC2 = Math.min(Math.max(Number(c2) || 0, 0), 20);
    const validC3 = Math.min(Math.max(Number(c3) || 0, 0), 15);
    const validC4 = Math.min(Math.max(Number(c4) || 0, 0), 15);
    const validC5 = Math.min(Math.max(Number(c5) || 0, 0), 15);
    const validC6 = Math.min(Math.max(Number(c6) || 0, 0), 10);
    const validC7 = Math.min(Math.max(Number(c7) || 0, 0), 5);
    const noteText = note || '';
    
    const afterData = { c1: validC1, c2: validC2, c3: validC3, c4: validC4, c5: validC5, c6: validC6, c7: validC7, note: noteText };
    const action = existing ? 'resubmit' : 'submit';

    await sql`
      INSERT INTO scores (judge_id, team_id, c1, c2, c3, c4, c5, c6, c7, note, updated_at, submitted_at, is_locked, entered_by, edited_by_admin)
      VALUES (${judge_id}, ${team_id}, ${validC1}, ${validC2}, ${validC3}, ${validC4}, ${validC5}, ${validC6}, ${validC7}, ${noteText}, now(), now(), true, 'judge', false)
      ON CONFLICT (judge_id, team_id) DO UPDATE 
      SET c1 = ${validC1}, c2 = ${validC2}, c3 = ${validC3}, c4 = ${validC4}, c5 = ${validC5}, c6 = ${validC6}, c7 = ${validC7}, note = ${noteText}, updated_at = now(), submitted_at = now(), is_locked = true, entered_by = 'judge', edited_by_admin = false
    `;

    // 3. เขียน Audit Log
    await sql`
      INSERT INTO score_audit (judge_id, team_id, action, actor, before_data, after_data)
      VALUES (${judge_id}, ${team_id}, ${action}, ${'judge:' + judge_id}, ${existing ? JSON.stringify(existing) : null}, ${JSON.stringify(afterData)})
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 });
  }
}
