console.log("✅ spotify.js loaded");

import SpotifyWebApi from "spotify-web-api-node";
import dotenv from "dotenv";

dotenv.config();

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

let accessToken = null;

/* -------------------------------------------
   AUTHENTICATION – Get Spotify Access Token
--------------------------------------------*/
export async function initSpotify() {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    accessToken = data.body.access_token;
    spotifyApi.setAccessToken(accessToken);
    console.log("✅ Spotify connected successfully");
  } catch (error) {
    console.error("❌ Spotify auth failed:", error.message);
  }
}

/* -------------------------------------------
   SEARCH – SONG, ARTIST, ALBUM
--------------------------------------------*/
export async function searchSpotify(query, type = "track") {
  try {
    if (!accessToken) await initSpotify();

    const response = await spotifyApi.search(query, [type], { limit: 6 });

    if (type === "track") {
      return response.body.tracks.items.map(track => ({
        id: track.id,
        title: track.name,
        artist: track.artists[0].name,
        poster: track.album.images[0]?.url || "",
        mediaType: "song",
        year: track.album.release_date?.split("-")[0] || "N/A",
        source: "spotify"
      }));
    }

    if (type === "artist") {
      return response.body.artists.items.map(artist => ({
        id: artist.id,
        title: artist.name,
        poster: artist.images[0]?.url || "",
        mediaType: "artist",
        year: "N/A",
        source: "spotify"
      }));
    }

    if (type === "album") {
      return response.body.albums.items.map(album => ({
        id: album.id,
        title: album.name,
        poster: album.images[0]?.url || "",
        mediaType: "album",
        year: album.release_date?.split("-")[0] || "N/A",
        source: "spotify"
      }));
    }

    return [];
  } catch (error) {
    console.error("Spotify search error:", error.message);
    return [];
  }
}

/* -------------------------------------------
   GET FULL TRACK DETAILS
--------------------------------------------*/
export async function getTrackById(id) {
  try {
    if (!accessToken) await initSpotify();

    const track = await spotifyApi.getTrack(id);

    return {
      id: track.body.id,
      title: track.body.name,
      artist: track.body.artists[0].name,
      album: track.body.album.name,
      preview: track.body.preview_url,
      duration: Math.floor(track.body.duration_ms / 1000),
      poster: track.body.album.images[0]?.url || "",
      mediaType: "song",
      source: "spotify"
    };
  } catch (error) {
    console.error("Get track error:", error.message);
    return null;
  }
}

/* -------------------------------------------
   GET FULL ARTIST DETAILS
--------------------------------------------*/
export async function getArtistById(id) {
  try {
    if (!accessToken) await initSpotify();

    const artist = await spotifyApi.getArtist(id);

    return {
      id: artist.body.id,
      title: artist.body.name,
      genres: artist.body.genres.join(", "),
      followers: artist.body.followers.total,
      poster: artist.body.images[0]?.url || "",
      mediaType: "artist",
      source: "spotify"
    };
  } catch (error) {
    console.error("Get artist error:", error.message);
    return null;
  }
}
