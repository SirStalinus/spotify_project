import { useState, useEffect } from 'react';
import { fetchUserTopArtists, fetchUserTopTracks } from '../../api/spotify-me.js';
import SimpleCard from '../../components/SimpleCard/SimpleCard';
import './DashboardPage.css';
import { useRequireToken } from '../../hooks/useRequireToken.js';

const DashboardPage = () => {
    const [topArtist, setTopArtist] = useState(null);
    const [topTrack, setTopTrack] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token, checking } = useRequireToken();

    // When token check completes and no token is available, show an error
    useEffect(() => {
        if (!checking && !token) {
            // defer setState to avoid synchronous updates within effect (lint / React guidance)
            Promise.resolve().then(() => {
                setError("Jeton d'accès manquant. Redirection vers la page de connexion.");
                setLoading(false);
            });
        }
    }, [checking, token]);

    // Fetch data once token is present and token check is finished
    useEffect(() => {
        if (checking) return;
        if (!token) return;

        const fetchData = async () => {
            try {
                setError(null);

                // top artists: API may return either raw Spotify object ({ items: [...] })
                // or a wrapper { data: <spotify>, error: <msg> } depending on implementation.
                const topArtistsResp = await fetchUserTopArtists(token);
                console.log('Top Artists:', topArtistsResp);

                // If API returned an error field, surface it
                if (topArtistsResp && topArtistsResp.error) {
                    setError(topArtistsResp.error);
                    setTopArtist(null);
                } else {
                    // prefer resp.items, otherwise resp.data.items
                    const topArtistsData = (topArtistsResp && topArtistsResp.items) ? topArtistsResp : (topArtistsResp && topArtistsResp.data) ? topArtistsResp.data : null;
                    if (topArtistsData && topArtistsData.items && topArtistsData.items.length > 0) {
                        setTopArtist(topArtistsData.items[0]);
                    } else {
                        setTopArtist(null);
                    }
                }

                // top tracks (same normalization)
                const topTracksResp = await fetchUserTopTracks(token);
                console.log('Top Tracks:', topTracksResp);

                if (topTracksResp && topTracksResp.error) {
                    setError(prev => prev ? prev + ' | ' + topTracksResp.error : topTracksResp.error);
                    setTopTrack(null);
                } else {
                    const topTracksData = (topTracksResp && topTracksResp.items) ? topTracksResp : (topTracksResp && topTracksResp.data) ? topTracksResp.data : null;
                    if (topTracksData && topTracksData.items && topTracksData.items.length > 0) {
                        setTopTrack(topTracksData.items[0]);
                    } else {
                        setTopTrack(null);
                    }
                }

                setLoading(false);
            } catch (err) {
                console.error('Erreur lors de la récupération des données:', err);
                setError(err.message || 'Erreur inconnue');
                setLoading(false);
            }
        };

        fetchData();
    }, [checking, token]);

    if (loading) {
        return <div className="dashboard-loading">Chargement...</div>;
    }

    return (
        <div className="dashboard-page">
            <h1>Tableau de Bord</h1>

            {error && <div className="dashboard-error">Erreur : {error}</div>}

            <div className="dashboard-content">
                {topArtist ? (
                    <div className="dashboard-section">
                        <h2>Votre artiste le plus écouté</h2>
                        <div className="dashboard-artist">
                            <SimpleCard
                                imageUrl={topArtist.images && topArtist.images.length > 0 ? topArtist.images[0].url : null}
                                title={topArtist.name}
                                subtitle={topArtist.genres ? topArtist.genres.join(', ') : 'Genres non disponibles'}
                                link={topArtist.external_urls && topArtist.external_urls.spotify ? topArtist.external_urls.spotify : null}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="dashboard-section">
                        <h2>Votre artiste le plus écouté</h2>
                        <div>Aucun artiste trouvé.</div>
                    </div>
                )}

                {topTrack ? (
                    <div className="dashboard-section">
                        <h2>Votre piste la plus écoutée</h2>
                        <SimpleCard
                            imageUrl={topTrack.album && topTrack.album.images && topTrack.album.images.length > 0
                                ? topTrack.album.images[0].url
                                : null}
                            title={topTrack.name}
                            subtitle={topTrack.genres ? topTrack.genres.join(', ') : 'Genres non disponibles'}
                            link={topTrack.external_urls && topTrack.external_urls.spotify ? topTrack.external_urls.spotify : null}
                        />
                    </div>
                ) : (
                    <div className="dashboard-section">
                        <h2>Votre piste la plus écoutée</h2>
                        <div>Aucune piste trouvée.</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;