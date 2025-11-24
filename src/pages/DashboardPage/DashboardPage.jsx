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
                const topArtists = await fetchUserTopArtists(token);
                console.log('Top Artists:', topArtists);
                if (topArtists && topArtists.items && topArtists.items.length > 0) {
                    setTopArtist(topArtists.items[0]);
                } else {
                    setTopArtist(null);
                }

                const topTracks = await fetchUserTopTracks(token);
                console.log('Top Tracks:', topTracks);
                if (topTracks && topTracks.items && topTracks.items.length > 0) {
                    setTopTrack(topTracks.items[0]);
                } else {
                    setTopTrack(null);
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
                            subtitle={`${topTrack.artists.map(artist => artist.name).join(', ')}`}
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