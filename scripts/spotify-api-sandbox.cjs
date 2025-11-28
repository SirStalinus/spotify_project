const { generateAccessToken } = require("./utils.cjs");
const { fetchPlaylistById } = require("../src/api/spotify-playlists");
const { artistCountForPlaylist } = require("../src/services/artist-count-for-playlist");

/**
 * Main function to demonstrate fetching a Spotify playlist.
 */
const main = async () => {
  var playlistId = "2IgPkhcHbgQ4s4PdCxljAx";

  const token = await generateAccessToken();

  try {
    // get playlist metadata (for display)
    const playlistRes = await fetchPlaylistById(token, playlistId);
    if (playlistRes.error) throw new Error(playlistRes.error);
    const playlist = playlistRes.data;

    // get top artists using the updated service
    const topArtists = await artistCountForPlaylist(token, playlistId, 5);

    console.log(`Playlist: ${playlist.name} by ${playlist.owner && playlist.owner.display_name ? playlist.owner.display_name : playlist.owner && playlist.owner.id}`);
    console.log('Top 5 Artists:');
    console.table(topArtists);
  } catch (error) {
    console.error('Error fetching playlist:', error);
  }
};

main();
