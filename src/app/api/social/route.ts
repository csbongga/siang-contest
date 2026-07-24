import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { rows } = await sql`SELECT * FROM social_votes`;
    return NextResponse.json({ social_votes: rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch social votes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const stateRes = await sql`SELECT is_finalized FROM system_state WHERE id = 1`;
    if (stateRes.rows.length > 0 && stateRes.rows[0].is_finalized) {
      return NextResponse.json({ error: 'ผลการแข่งขันถูกล็อกแล้ว' }, { status: 403 });
    }

    const { votes } = await request.json();
    // votes should be an array of { team_id, garlands, likes, comments, shares }

    if (!Array.isArray(votes)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    for (const vote of votes) {
      const g = Number(vote.garlands) || 0;
      const l = Number(vote.likes) || 0;
      const c = Number(vote.comments) || 0;
      const s = Number(vote.shares) || 0;

      await sql`
        INSERT INTO social_votes (team_id, garlands, likes, comments, shares, updated_at)
        VALUES (${vote.team_id}, ${g}, ${l}, ${c}, ${s}, now())
        ON CONFLICT (team_id) DO UPDATE 
        SET garlands = ${g}, likes = ${l}, comments = ${c}, shares = ${s}, updated_at = now()
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update social votes' }, { status: 500 });
  }
}
