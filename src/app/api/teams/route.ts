import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { rows } = await sql`SELECT * FROM teams ORDER BY id ASC`;
    return NextResponse.json({ teams: rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {

    const { id, name } = await request.json();
    if (!id || !name) {
      return NextResponse.json({ error: 'Missing id or name' }, { status: 400 });
    }

    await sql`INSERT INTO teams (id, name) VALUES (${id}, ${name}) ON CONFLICT (id) DO UPDATE SET name = ${name}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    await sql`DELETE FROM teams WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 });
  }
}
