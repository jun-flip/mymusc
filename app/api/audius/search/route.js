export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const offset = searchParams.get('offset') || 0;
  if (!q) {
    return Response.json({ error: 'Query is required' }, { status: 400 });
  }
  try {
    const url = `https://api.audius.co/v1/tracks/search?query=${encodeURIComponent(q)}&app_name=audiofeel&limit=20&offset=${offset}`;
    const response = await fetch(url);
    const data = await response.json();
    return Response.json(data);
  } catch {
    return Response.json({ error: 'Failed to fetch from Audius' }, { status: 500 });
  }
} 