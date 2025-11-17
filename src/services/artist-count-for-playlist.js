const { fetchPlaylistById } = require('./spotify-api');

/**
 * Compte les apparitions des artistes dans une playlist Spotify.
 * @param {string} token - token d'accès Spotify
 * @param {string} playlistId - id de la playlist
 * @returns {Promise<Record<string, number>>} - objet { artistName: count }
 */
async function artistCountForPlaylist(token, playlistId) {
    if (!token) throw new Error('artistCountForPlaylist: token is required');
    if (!playlistId) throw new Error('artistCountForPlaylist: playlistId is required');

    try {
        const playlist = await fetchPlaylistById(token, playlistId);

        // Supporte plusieurs formes de retour : { tracks: { items: [...] } }, { items: [...] } ou tableau direct
        const items = playlist?.tracks?.items ?? playlist?.items ?? (Array.isArray(playlist) ? playlist : []);

        const counts = {};
        for (const item of items) {
            const artists = item?.track?.artists ?? item?.artists ?? [];
            for (const artist of artists) {
                const name = artist?.name ?? 'Unknown';
                counts[name] = (counts[name] || 0) + 1;
            }
        }

        return counts;
    } catch (err) {
        const msg = `Failed to count artists for playlist ${playlistId}: ${err?.message ?? err}`;
        const e = new Error(msg);
        e.cause = err;
        throw e;
    }
}

module.exports = { artistCountForPlaylist };