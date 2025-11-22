import { searchTitles } from '../js/tmdb.js';
import { searchGames } from '../js/rawg.js';
import { searchSpotify } from '../spotify.js';

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
    const query = req.query.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    console.log('🔍 Searching:', query);

    const [tmdb, games, spotify] = await Promise.all([
      searchTitles(query).catch(() => []),
      searchGames(query).catch(() => []),
      searchSpotify(query, 'track').catch(() => [])
    ]);

    const combined = [...(tmdb || []), ...(games || []), ...(spotify || [])];

    console.log('✅ Sending:', combined.length, 'results');
    res.status(200).json(combined);

  } catch (err) {
    console.error('❌ Search error:', err.message);
    res.status(500).json({ error: 'Search failed' });
  }
}
