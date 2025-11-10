import { SPOTIFY_API_BASE } from "./spotify-commons.js";

/**
 * Fetch a Spotify artist by its ID.
 * @param {string} token - The Spotify access token.
 * @param {string} artistId - The ID of the artist to fetch.
 * @returns {Promise<{ artist: object|null, error: string|null }>} - The artist data or an error message.
 */
export async function fetchArtistById(token, artistId) {
  // early return if no token
  if (!token) {
    return { error: 'No access token found.', artist: null };
  }
  try {
    // fetch artist from Spotify API
    const res = await fetch(`${SPOTIFY_API_BASE}/artists/${artistId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    // handle potential API error
    if (data.error) {
      return { error: data.error.message, artist: null };
    }
    // return fetched artist
    return { data, error: null };
  } catch {
    return { error: 'Failed to fetch playlist.', artist: null };
  }
}