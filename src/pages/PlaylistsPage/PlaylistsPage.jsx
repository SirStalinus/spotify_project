import { useState, useEffect } from 'react';
import { buildTitle } from '../../constants/appMeta.js';
import { useRequireToken } from '../../hooks/useRequireToken.js';
import PlayListItem from '../../components/PlayListItem/PlayListItem.jsx';
import { fetchUserPlaylists } from '../../api/spotify-me.js';
import { handleTokenError } from '../../utils/handleTokenError.js';
import './PlaylistsPage.css';
import '../PageLayout.css';
import { useNavigate } from 'react-router-dom';

/**
 * Number of playlists to fetch
 */
export const limit = 10;

/**
 * Playlists Page
 * @returns {JSX.Element}
 */
export default function PlaylistsPage() {
  // Initialize navigate function
  const navigate = useNavigate();

  // state for playlists data
  const [playlists, setPlaylists] = useState([]);

  // state for loading and error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // total number of playlists available on the account
  const [total, setTotal] = useState(null);

  // require token to fetch playlists
  const { token } = useRequireToken();

  // Set document title
  useEffect(() => { document.title = buildTitle('Playlists'); }, []);


  useEffect(() => {
    if (!token) return; // wait for auth check
    // fetch user playlists when token changes
    fetchUserPlaylists(token, limit)
      .then(res => {
        if (res.error) {
          if (!handleTokenError(res.error, navigate)) {
            setError(res.error);
          }
        } else {
            // store total count if provided by API, fallback to items length
            setTotal(res.data?.total ?? res.data?.items?.length ?? null);
            // ensure we only display up to the requested limit
            const items = res.data?.items ?? [];
            setPlaylists(items.slice(0, limit));
        }
      }
      )
      .catch(err => { setError(err.message); })
      .finally(() => { setLoading(false); });
  }, [token, navigate]);

  // number of playlists that should be displayed according to the limit (but not more than total)
  const displayedCount = Math.min(limit, total ?? playlists.length);

  return (
    <section className="playlists-container page-container" aria-labelledby="playlists-title">
      <h1 id="playlists-title" className="playlists-title page-title">Your Playlists</h1>
      <h2 className="playlists-count">{displayedCount} of {total ?? playlists.length} Playlists</h2>
      {loading && <output className="playlists-loading" data-testid="loading-indicator">Loading playlists…</output>}
      {error && !loading && <div className="playlists-error" role="alert">{error}</div>}
      {!loading && !error && (
        <ol className="playlists-list">
          {playlists.map((playlist) => (
            <PlayListItem key={playlist.id} playlist={playlist} />
          ))}
        </ol>
      )}
    </section>
  );
}
