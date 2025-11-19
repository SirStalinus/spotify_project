import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchPlaylistById } from "../../api/spotify-playlists";
import { handleTokenError } from "../../utils/handleTokenError.js";
import TrackItem from "../../components/TrackItem/TrackItem.jsx";
import './PlaylistDetailPage.css';

export default function PlaylistDetailPage() {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // set document title expected by tests
  useEffect(() => {
    document.title = "Playlist | Spotify App";
  }, []);

  useEffect(() => {
    if (!id) return;

    // récupérer le token depuis le localStorage (adapter la clé si nécessaire)
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("spotify_access_token") ||
      localStorage.getItem("token");

    if (!token) {
      setError("No access token available");
      return;
    }

    setLoading(true);
    setError(null);

    fetchPlaylistById(token, id)
      .then((res) => {
        if (res?.error) {
          // handle token specific errors via helper (tests spy on this)
          if (typeof handleTokenError === "function") {
            handleTokenError(res.error, () => {
              /* optional callback for redirect */
            });
          }
          setError(res.error);
          setPlaylist(null);
        } else {
          // accept both shapes: { data } or { playlist }
          const pl = res?.data ?? res?.playlist ?? null;
          setPlaylist(pl);
          // afficher dans la console pour vérifier le format (ex : première piste)
          console.log("Fetched playlist:", pl);
          console.log("First track (if present):", pl?.tracks?.items?.[0]?.track);
        }
      })
      .catch((e) => {
        console.error(e);
        setError(e?.message ?? "Failed to fetch playlist.");
        setPlaylist(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="playlist-detail-page">

      {loading && (
        <div role="status" data-testid="loading-indicator">
          Loading playlist…
        </div>
      )}

      {error && (
        <div role="alert" style={{ color: "red" }}>
          {error}
        </div>
      )}

      {playlist && (
        <>
          <header className="playlist-header">
            <img
              src={playlist.images?.[0]?.url}
              alt={`Cover of ${playlist.name}`}
              style={{ width: 200, height: 200, objectFit: "cover" }}
            />
            <div className="playlist-meta">
              <h1>{playlist.name}</h1>
              {playlist.description && <h2>{playlist.description}</h2>}
              {playlist.external_urls?.spotify && (
                <a
                  href={playlist.external_urls.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in Spotify
                </a>
              )}
            </div>
          </header>

          <section className="playlist-tracks">
            <h4>Tracks ({playlist.tracks?.total ?? 0})</h4>
            <ul>
              {playlist.tracks?.items?.length ? (
                playlist.tracks.items.map((item, idx) => {
                  // item.track est la vraie entité track retournée par l'API Spotify
                  const track = item?.track;
                  if (!track) return null;
                  return (
                    <li key={track.id || `${idx}-${track.name}`}>
                      <TrackItem track={track} index={idx + 1} />
                    </li>
                  );
                })
              ) : (
                <li>No tracks found</li>
              )}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}