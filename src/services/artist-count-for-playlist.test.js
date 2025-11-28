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
    expect(result).toEqual([
      { Artist: 'A', 'Number of Tracks': 2 },
      { Artist: 'B', 'Number of Tracks': 1 },
    ]);
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
    expect(result).toEqual([
      { Artist: 'A', 'Number of Tracks': 2 },
      { Artist: 'B', 'Number of Tracks': 1 },
    ]);
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

  it('orders artists with equal counts alphabetically after sorting by count', async () => {
    const token = 'token';
    const playlistId = 'pl3';

    // C appears twice, A and B appear once each. A and B should be ordered alphabetically.
    const playlist = {
      tracks: {
        items: [
          { track: { artists: [{ name: 'C' }] } },
          { track: { artists: [{ name: 'A' }] } },
          { track: { artists: [{ name: 'B' }] } },
          { track: { artists: [{ name: 'C' }] } },
        ],
        next: null,
      },
    };

    fetchPlaylistById.mockResolvedValueOnce({ data: playlist, error: null });

    const result = await artistCountForPlaylist(token, playlistId, 5);
    expect(result).toEqual([
      { Artist: 'C', 'Number of Tracks': 2 },
      { Artist: 'A', 'Number of Tracks': 1 },
      { Artist: 'B', 'Number of Tracks': 1 },
    ]);
  });

  it('stops pagination when next page response has no items and uses only first page counts', async () => {
    const token = 'token';
    const playlistId = 'pl4';

    const firstPage = {
      tracks: {
        items: [ { track: { artists: [{ name: 'X' }] } } ],
        next: 'http://api/next',
      },
    };

    fetchPlaylistById.mockResolvedValueOnce({ data: firstPage, error: null });

    // next page returns a JSON without `items` -> should trigger the break branch
    globalThis.fetch = jest.fn().mockResolvedValue({ json: async () => ({ message: 'no data' }) });

    const result = await artistCountForPlaylist(token, playlistId);
    expect(result).toEqual([
      { Artist: 'X', 'Number of Tracks': 1 },
    ]);
    expect(globalThis.fetch).toHaveBeenCalledWith('http://api/next', expect.any(Object));
  });

  it('handles playlists that expose items at top-level (fallback branch)', async () => {
    const token = 'token';
    const playlistId = 'pl5';

    const playlist = {
      items: [
        { track: { artists: [{ name: 'A' }, { name: 'B' }] } },
        { track: { artists: [{ name: 'A' }] } },
      ],
    };

    fetchPlaylistById.mockResolvedValueOnce({ data: playlist, error: null });

    const result = await artistCountForPlaylist(token, playlistId);
    expect(result).toEqual([
      { Artist: 'A', 'Number of Tracks': 2 },
      { Artist: 'B', 'Number of Tracks': 1 },
    ]);
  });
});
