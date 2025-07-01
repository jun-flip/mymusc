import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const offset = searchParams.get('offset') || 0;
  if (!q) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }
  try {
    const url = `https://api.audius.co/v1/tracks/search?query=${encodeURIComponent(q)}&app_name=audiofeel&limit=20&offset=${offset}`;
    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json({ error: 'Audius API error' }, { status: 502 });
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch from Audius' }, { status: 500 });
  }
} 