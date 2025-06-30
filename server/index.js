const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

// Поиск треков через Audius API
app.get('/api/audius/search', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Query is required' });
  }
  try {
    const url = `https://api.audius.co/v1/tracks/search?query=${encodeURIComponent(q)}&app_name=audiofeel&limit=20`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch from Audius' });
  }
});

// Прокси для стриминга трека Audius
app.get('/api/audius/stream/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Track id required' });
  try {
    const url = `https://api.audius.co/v1/tracks/${id}/stream?app_name=audiofeel`;
    const response = await fetch(url, { redirect: 'manual' });
    if (response.status === 302) {
      const redirectUrl = response.headers.get('location');
      res.redirect(redirectUrl);
    } else {
      res.status(500).json({ error: 'Failed to get stream url from Audius' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Audius stream proxy error' });
  }
});

// Поиск артистов через Audius API
app.get('/api/audius/search_artist', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Query is required' });
  }
  try {
    const url = `https://api.audius.co/v1/users/search?query=${encodeURIComponent(q)}&app_name=audiofeel&limit=10`;
    const response = await fetch(url);
    const data = await response.json();
    // Для каждого артиста можно получить последние треки (latest_tracks)
    // Audius API не возвращает их сразу, но для демо можно вернуть только артистов
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch artists from Audius' });
  }
});

// Поиск альбомов через Audius API
app.get('/api/audius/search_album', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Query is required' });
  }
  try {
    const url = `https://api.audius.co/v1/albums/search?query=${encodeURIComponent(q)}&app_name=audiofeel&limit=10`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch albums from Audius' });
  }
});

// Здесь будет Jamendo endpoint

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
}); 