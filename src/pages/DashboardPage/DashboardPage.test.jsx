import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from './DashboardPage';

// Mock the API module
jest.mock('../../api/spotify-me.js', () => ({
  fetchUserTopArtists: jest.fn(),
  fetchUserTopTracks: jest.fn(),
}));

// Mock the useRequireToken hook
jest.mock('../../hooks/useRequireToken.js', () => ({
  useRequireToken: jest.fn(),
}));

import { fetchUserTopArtists, fetchUserTopTracks } from '../../api/spotify-me.js';
import { useRequireToken } from '../../hooks/useRequireToken.js';

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // default: token present and checking finished
    useRequireToken.mockReturnValue({ token: 'fake-token', checking: false });
  });

  it('renders top artist and top track when API returns data', async () => {
    const artist = {
      name: 'Artist Name',
      images: [{ url: 'http://artist.img' }],
      external_urls: { spotify: 'https://open.spotify/artist/1' },
      genres: ['pop'],
    };
    const track = {
      name: 'Track Name',
      album: { images: [{ url: 'http://album.img' }] },
      artists: [{ name: 'Artist Name' }],
      external_urls: { spotify: 'https://open.spotify/track/1' },
    };

    fetchUserTopArtists.mockResolvedValueOnce({ items: [artist] });
    fetchUserTopTracks.mockResolvedValueOnce({ items: [track] });

    render(<DashboardPage />);

    // wait for artist and track names to appear
    expect(await screen.findByText('Artist Name')).toBeInTheDocument();
    expect(await screen.findByText('Track Name')).toBeInTheDocument();

    // There should be two link buttons (artist + track) with correct hrefs
    const links = await screen.findAllByTestId('link');
    const hrefs = links.map(a => a.getAttribute('href'));
    expect(hrefs).toEqual(expect.arrayContaining(["https://open.spotify/artist/1", "https://open.spotify/track/1"]));
  });

  it('shows fallbacks when API returns empty lists', async () => {
    fetchUserTopArtists.mockResolvedValueOnce({ items: [] });
    fetchUserTopTracks.mockResolvedValueOnce({ items: [] });

    render(<DashboardPage />);

    expect(await screen.findByText('Aucun artiste trouvé.')).toBeInTheDocument();
    expect(await screen.findByText('Aucune piste trouvée.')).toBeInTheDocument();
  });

  it('displays an error when the API call fails', async () => {
    fetchUserTopArtists.mockRejectedValueOnce(new Error('No access token found.'));
    // tracks may or may not be called, but provide a safe fallback
    fetchUserTopTracks.mockResolvedValueOnce({ items: [] });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Erreur :/)).toBeInTheDocument();
      expect(screen.getByText(/No access token found\./)).toBeInTheDocument();
    });
  });

  it('shows token-missing error when useRequireToken reports no token', async () => {
    useRequireToken.mockReturnValueOnce({ token: null, checking: false });
    // provide safe API defaults
    fetchUserTopArtists.mockResolvedValueOnce({ items: [] });
    fetchUserTopTracks.mockResolvedValueOnce({ items: [] });

    render(<DashboardPage />);

    // match substring of the rendered error (component prefixes with "Erreur : ")
    expect(await screen.findByText(/Jeton d'accès manquant/)).toBeInTheDocument();
    // ensure loading stopped
    expect(screen.queryByText('Chargement...')).not.toBeInTheDocument();
  });

  it('displays API error when artists response contains error', async () => {
    useRequireToken.mockReturnValueOnce({ token: 'fake-token', checking: false });
    fetchUserTopArtists.mockResolvedValueOnce({ error: 'Artists API down' });
    fetchUserTopTracks.mockResolvedValueOnce({ items: [] });

    render(<DashboardPage />);

    expect(await screen.findByText(/Erreur :/)).toBeInTheDocument();
    expect(screen.getByText(/Artists API down/)).toBeInTheDocument();
    expect(screen.getByText('Aucun artiste trouvé.')).toBeInTheDocument();
  });

  it('displays track error and keeps artist when tracks response contains error', async () => {
    const artist = { name: 'Solo Artist', images: [{ url: 'http://a.img' }], external_urls: { spotify: 'https://open.spotify/artist/solo' } };
    useRequireToken.mockReturnValueOnce({ token: 'fake-token', checking: false });
    fetchUserTopArtists.mockResolvedValueOnce({ items: [artist] });
    fetchUserTopTracks.mockResolvedValueOnce({ error: 'Tracks API failed' });

    render(<DashboardPage />);

    // artist should render
    expect(await screen.findByText('Solo Artist')).toBeInTheDocument();
    // track fallback
    expect(await screen.findByText('Aucune piste trouvée.')).toBeInTheDocument();
    // error should mention the tracks API error
    expect(screen.getByText(/Tracks API failed/)).toBeInTheDocument();
  });
});
