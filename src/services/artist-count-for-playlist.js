import { fetchPlaylistById } from '../api/spotify-playlists.js';

/**
 * Count artist appearances for a given playlist and return top N artists.
 * @param {string} token - Spotify access token
 * @param {string} playlistId - Spotify playlist ID
 * @param {number} [topN=5] - Number of top artists to return
 * @returns {Promise<Array<{ Artist: string, 'Number of Tracks': number }>>} - Sorted array of top artists (suitable for console.table)
 */
export async function artistCountForPlaylist(token, playlistId, topN = 5) {
  if (!token) throw new Error('No access token provided');
  if (!playlistId) throw new Error('No playlistId provided');

  const result = await fetchPlaylistById(token, playlistId);
  if (result.error) {
    throw new Error(result.error);
  }
  const playlist = result.data;
  if (!playlist) return [];

  // Spotify playlist object contains tracks as a paged object at playlist.tracks
  // with .items array where each item has .track which contains artists array.
  const counts = {};

  // helper to accumulate from an items array
  function accumulateItems(items) {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      const track = item && (item.track || item); // some APIs may return track directly
      if (!track) continue;
      const artists = Array.isArray(track.artists) ? track.artists : [];
      for (const artist of artists) {
        const name = artist && (artist.name || artist.id);
        if (!name) continue;
        counts[name] = (counts[name] || 0) + 1;
      }
    }
  }

  // accumulate first page
  if (playlist.tracks) {
    accumulateItems(playlist.tracks.items);

    // if there are more pages, fetch them using the provided href/next link
    let next = playlist.tracks.next;
    while (next) {
      // fetch next page directly
      const res = await fetch(next, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json && json.items) {
        accumulateItems(json.items);
        next = json.next;
      } else {
        break;
      }
    }
  } else if (playlist.items) {
    // fallback: some responses may include items at top-level
    accumulateItems(playlist.items);
  }

  // Convert counts object to sorted array of { Artist, 'Number of Tracks' }
  const sorted = Object.entries(counts)
    .map(([artist, count]) => ({ Artist: artist, 'Number of Tracks': count }))
    .sort((a, b) => b['Number of Tracks'] - a['Number of Tracks'] || a.Artist.localeCompare(b.Artist))
    .slice(0, topN);

  return sorted;
}
