export async function searchSpotifyClient(query, type = "track") {
    try {
      const res = await fetch(`/spotify/search?q=${encodeURIComponent(query)}&type=${type}`);
      if (!res.ok) throw new Error("Spotify fetch failed");
  
      return await res.json();
    } catch (err) {
      console.error("Spotify client error:", err.message);
      return [];
    }
  }
  
  