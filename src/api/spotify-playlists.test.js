// src/api/spotify-playlists.test.js
import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { fetchPlaylistById } from "./spotify-playlists";
import { SPOTIFY_API_BASE } from "./spotify-commons";

describe("spotify-playlists API", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe("fetchPlaylistById", () => {
    test("returns error if no token is provided", async () => {
      const result = await fetchPlaylistById("", "playlist123");
      expect(result).toEqual({
        error: "No access token found.",
        data: null,
      });
    });

    test("returns playlist on successful fetch", async () => {
      const mockPlaylist = { id: "playlist123", name: "My Playlist" };
      globalThis.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockPlaylist),
      });

      const result = await fetchPlaylistById("valid_token", "playlist123");
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${SPOTIFY_API_BASE}/playlists/playlist123`,
        {
          headers: { Authorization: "Bearer valid_token" },
        }
      );
      expect(result).toEqual({
        data: mockPlaylist,
        error: null,
      });
    });

    test("returns error if Spotify API returns error in response", async () => {
      const mockError = { error: { message: "Invalid playlist ID" } };
      globalThis.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockError),
      });

      const result = await fetchPlaylistById("valid_token", "bad_id");
      expect(result).toEqual({
        error: "Invalid playlist ID",
        data: null,
      });
    });

    test("returns error if fetch throws", async () => {
      globalThis.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      const result = await fetchPlaylistById("any_token", "playlist123");
      expect(result).toEqual({
        error: "Failed to fetch playlist.",
        data: null,
      });
    });
  describe("fetchPlaylistById network and nonexistent playlist cases", () => {
    test("returns error if network is down (fetch rejects with TypeError)", async () => {
      globalThis.fetch = jest.fn().mockRejectedValue(new TypeError("Network is down"));

      const result = await fetchPlaylistById("valid_token", "playlist123");
      expect(result).toEqual({
        error: "Failed to fetch playlist.",
        data: null,
      });
    });

    test("returns error when Spotify returns 404 with error message for nonexistent playlist", async () => {
      globalThis.fetch = jest.fn().mockResolvedValue({
        status: 404,
        json: jest.fn().mockResolvedValue({ error: { message: "Playlist not found" } }),
      });

      const result = await fetchPlaylistById("valid_token", "nonexistent");
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${SPOTIFY_API_BASE}/playlists/nonexistent`,
        {
          headers: { Authorization: "Bearer valid_token" },
        }
      );
      expect(result).toEqual({
        error: "Playlist not found",
        data: null,
      });
    });

    test("returns error when response.json throws (invalid JSON)", async () => {
      globalThis.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
      });

      const result = await fetchPlaylistById("valid_token", "playlist123");
      expect(result).toEqual({
        error: "Failed to fetch playlist.",
        data: null,
      });
    });
  });
})});