// Tests for artistCountForPlaylist

jest.mock('../api/spotify-playlists.js', () => ({
  fetchPlaylistById: jest.fn(),
}));

import { fetchPlaylistById } from '../api/spotify-playlists.js';
import { artistCountForPlaylist } from './artist-count-for-playlist.js';

describe('artistCountForPlaylist', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    if (globalThis.fetch) delete globalThis.fetch;
  });

  it('counts artist appearances in a single-page playlist', async () => {
    const token = 'token';
    const playlistId = 'pl1';

    const playlist = {
      tracks: {
        items: [
          { track: { artists: [{ name: 'A' }, { name: 'B' }] } },
          { track: { artists: [{ name: 'A' }] } },
        ],
        next: null,
      },
    };

    fetchPlaylistById.mockResolvedValueOnce({ data: playlist, error: null });

    const result = await artistCountForPlaylist(token, playlistId);
    expect(result).toEqual({ A: 2, B: 1 });
    expect(fetchPlaylistById).toHaveBeenCalledWith(token, playlistId);
  });

  it('follows pagination and accumulates counts across pages', async () => {
    const token = 'token';
    const playlistId = 'pl2';

    const firstPage = {
      tracks: {
        items: [
          { track: { artists: [{ name: 'A' }] } },
        ],
        next: 'http://api/next',
      },
    };

    const secondPageResponse = {
      items: [ { track: { artists: [{ name: 'B' }, { name: 'A' }] } } ],
      next: null,
    };

    fetchPlaylistById.mockResolvedValueOnce({ data: firstPage, error: null });

    globalThis.fetch = jest.fn().mockResolvedValue({
      json: async () => secondPageResponse,
    });

    const result = await artistCountForPlaylist(token, playlistId);
    expect(result).toEqual({ A: 2, B: 1 });
    expect(globalThis.fetch).toHaveBeenCalledWith('http://api/next', expect.any(Object));
  });

  it('throws when token is missing', async () => {
    await expect(artistCountForPlaylist(null, 'pl')).rejects.toThrow('No access token provided');
  });

  it('throws when playlistId is missing', async () => {
    await expect(artistCountForPlaylist('token', null)).rejects.toThrow('No playlistId provided');
  });

  it('propagates API error from fetchPlaylistById', async () => {
    fetchPlaylistById.mockResolvedValueOnce({ data: null, error: 'Not found' });
    await expect(artistCountForPlaylist('token', 'pl')).rejects.toThrow('Not found');
  });
});
