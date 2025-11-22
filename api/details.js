import { fetchById } from '../js/tmdb.js';
import { fetchGameById } from '../js/rawg.js';
import { getTrackById, getArtistById } from '../spotify.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, source, type } = req.query;

    if (!id || !source || !type) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    let data = null;

    if (source === 'tmdb') {
      data = await fetchById(id, type).catch(() => null);
    } 
    else if (source === 'rawg') {
      data = await fetchGameById(id).catch(() => null);
    } 
    else if (source === 'spotify') {
      if (type === 'song') data = await getTrackById(id);
      if (type === 'artist') data = await getArtistById(id);
    }

    if (!data) {
      return res.status(500).json({ error: 'Failed to fetch content' });
    }

    res.status(200).json(data);

  } catch (err) {
    console.error('❌ Detail error:', err);
    res.status(500).json({ error: 'Details failed' });
  }
}
