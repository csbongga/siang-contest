import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const judge_id = searchParams.get('judge_id');
    const team_id = searchParams.get('team_id');
    const all = searchParams.get('all');

    if (all === 'true') {
      // ดึงคะแนนทั้งหมด เพื่อใช้ในหน้า results
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
      // ดึงคะแนนทั้งหมดของกรรมการคนนี้ เพื่อดูว่าให้คะแนนทีมไหนไปแล้วบ้าง
      const { rows } = await sql`SELECT team_id FROM scores WHERE judge_id = ${judge_id}`;
      return NextResponse.json({ scored_teams: rows.map(r => r.team_id) });
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

    // Validate ให้อยู่ในช่วงคะแนน
    const validC1 = Math.min(Math.max(Number(c1) || 0, 0), 20);
    const validC2 = Math.min(Math.max(Number(c2) || 0, 0), 20);
    const validC3 = Math.min(Math.max(Number(c3) || 0, 0), 15);
    const validC4 = Math.min(Math.max(Number(c4) || 0, 0), 15);
    const validC5 = Math.min(Math.max(Number(c5) || 0, 0), 15);
    const validC6 = Math.min(Math.max(Number(c6) || 0, 0), 10);
    const validC7 = Math.min(Math.max(Number(c7) || 0, 0), 5);
    const noteText = note || '';

    await sql`
      INSERT INTO scores (judge_id, team_id, c1, c2, c3, c4, c5, c6, c7, note, updated_at)
      VALUES (${judge_id}, ${team_id}, ${validC1}, ${validC2}, ${validC3}, ${validC4}, ${validC5}, ${validC6}, ${validC7}, ${noteText}, now())
      ON CONFLICT (judge_id, team_id) DO UPDATE 
      SET c1 = ${validC1}, c2 = ${validC2}, c3 = ${validC3}, c4 = ${validC4}, c5 = ${validC5}, c6 = ${validC6}, c7 = ${validC7}, note = ${noteText}, updated_at = now()
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 });
  }
}
