export async function GET(req, { params }) {
  const { id } = await params;
  if (!id) {
    return Response.json({ error: 'Track id required' }, { status: 400 });
  }
  try {
    const url = `https://api.audius.co/v1/tracks/${id}/stream?app_name=audiofeel`;
    const response = await fetch(url, { redirect: 'manual' });
    if (response.status === 302) {
      const redirectUrl = response.headers.get('location');
      return Response.redirect(redirectUrl);
    } else {
      return Response.json({ error: 'Failed to get stream url from Audius' }, { status: 500 });
    }
  } catch (err) {
    return Response.json({ error: 'Audius stream proxy error' }, { status: 500 });
  }
} 