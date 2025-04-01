const express = require("express");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");
const csv = require("csv-parser");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:8888/callback";
const FRONTEND_URI = "http://localhost:5173";

// 🔐 Redirect user to Spotify login
app.get("/login", (req, res) => {
  const scopes = [
    "user-read-private",
    "user-read-email",
    "playlist-modify-public",
    "playlist-modify-private",
  ];

  const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${scopes.join(
    "%20"
  )}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

  res.redirect(authUrl);
});

// 🔁 Handle Spotify callback
app.get("/callback", async (req, res) => {
  const code = req.query.code || null;

  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, refresh_token } = response.data;

    res.redirect(
      `${FRONTEND_URI}?access_token=${access_token}&refresh_token=${refresh_token}`
    );
  } catch (err) {
    console.error("Error getting tokens:", err.response?.data || err.message);
    res.status(500).json({ error: "Token exchange failed" });
  }
});

// ✅ Load clustered songs into memory
let clusteredSongs = [];

fs.createReadStream("clustered_spotify_songs.csv")
  .pipe(csv())
  .on("data", (row) => {
    clusteredSongs.push(row);
  })
  .on("end", () => {
    console.log("✅ Clustered songs loaded into memory.");
  });

// ✅ Get all songs or 100 random songs by mood
app.get("/api/songs", (req, res) => {
  const mood = req.query.mood;

  // Utility to shuffle array
  const shuffleArray = (arr) => {
    return arr.sort(() => Math.random() - 0.5);
  };

  if (!mood) return res.json(clusteredSongs);

  const filtered = clusteredSongs.filter(song => song.cluster === mood);
  const random100 = shuffleArray(filtered).slice(0, 100);

  res.json(random100);
});


// ✅ Create Spotify Playlist (max 100 songs)
app.post("/api/create-playlist", async (req, res) => {
  const { access_token, track_uris, playlist_name } = req.body;

  if (!access_token || !track_uris?.length) {
    return res.status(400).json({ error: "Missing access token or track URIs" });
  }

  try {
    const userRes = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const userId = userRes.data.id;

    const playlistRes = await axios.post(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      {
        name: playlist_name || "My Mood-Based Playlist",
        description: "Created with MyPlaylistMaker 🎶",
        public: false,
      },
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    const playlistId = playlistRes.data.id;

    // ✅ Limit to 100 tracks only
    const limitedTrackUris = track_uris.slice(0, 100);

    await axios.post(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        uris: limitedTrackUris,
      },
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    res.json({ playlist_url: playlistRes.data.external_urls.spotify });
  } catch (err) {
    console.error("Error creating playlist:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to create playlist" });
  }
});

// 🚀 Start the server and auto open login
const PORT = 8888;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);

  try {
    const open = (await import("open")).default;
    await open("http://localhost:8888/login");
  } catch (err) {
    console.error("❌ Failed to open browser:", err.message);
  }
});
