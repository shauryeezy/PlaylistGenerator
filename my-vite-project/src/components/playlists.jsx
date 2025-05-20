import { useState, useEffect } from "react";

export default function PlaylistGenerator() {
  const [songs, setSongs] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [mood, setMood] = useState("");
  const [genre, setGenre] = useState("");
  const [bpmMin, setBpmMin] = useState(0);
  const [bpmMax, setBpmMax] = useState(200);
  const [danceability, setDanceability] = useState("");
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8888/api/songs")
      .then((res) => res.json())
      .then((data) => setSongs(data))
      .catch((error) => console.error("Error fetching songs:", error));
  }, []);

  const generatePlaylist = () => {
    setLoading(true);

    let filtered = songs;

    if (mood !== "") {
      filtered = filtered.filter((song) => song.cluster === mood);
    }

    if (genre !== "") {
      filtered = filtered.filter((song) => song.playlist_genre?.toLowerCase() === genre.toLowerCase());
    }

    if (danceability !== "") {
      filtered = filtered.filter((song) => {
        const d = parseFloat(song.danceability);
        return danceability === "danceable" ? d >= 0.6 : d < 0.6;
      });
    }

    filtered = filtered.filter((song) => {
      const bpm = parseFloat(song.tempo);
      return !isNaN(bpm) && bpm >= bpmMin && bpm <= bpmMax;
    });

    const shuffled = filtered.sort(() => 0.5 - Math.random());
    setTimeout(() => {
      setFilteredSongs(shuffled.slice(0, 20));
      setPlaylistUrl("");
      setLoading(false);
    }, 500); // simulate loader
  };

  const handleCreatePlaylist = async () => {
    const accessToken = localStorage.getItem("spotify_access_token");
    if (!accessToken) {
      alert("Please log in to Spotify first.");
      return;
    }

    const trackUris = filteredSongs
      .filter((song) => song.track_id)
      .map((song) => `spotify:track:${song.track_id}`);

    if (trackUris.length === 0) {
      alert("No valid tracks to add.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8888/api/create-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: accessToken,
          track_uris: trackUris,
          playlist_name: "My Mood-Based Playlist",
        }),
      });

      const data = await response.json();
      if (data.playlist_url) setPlaylistUrl(data.playlist_url);
      else alert("Failed to create playlist.");
    } catch (error) {
      console.error("Error creating playlist:", error);
      alert("Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200 px-4 py-8 flex flex-col items-center font-[Inter]">
      <h1 className="text-4xl font-extrabold text-gray-800 mb-6 drop-shadow-md tracking-tight">🎶 My Playlist Maker</h1>

      <div className="w-full max-w-3xl bg-white/70 backdrop-blur-xl rounded-lg shadow-xl p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Generate Your Mood-Based Playlist</h2>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block mb-1 font-medium text-gray-700">Select Mood</label>
            <select className="w-full border rounded px-3 py-2" value={mood} onChange={(e) => setMood(e.target.value)}>
              <option value="">All</option>
              <option value="0">Chill</option>
              <option value="1">Happy</option>
              <option value="2">Energetic</option>
              <option value="3">Sad</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">Select Genre</label>
            <select className="w-full border rounded px-3 py-2" value={genre} onChange={(e) => setGenre(e.target.value)}>
              <option value="">All</option>
              <option value="pop">Pop</option>
              <option value="rock">Rock</option>
              <option value="jazz">Jazz</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">Select Danceability</label>
            <select className="w-full border rounded px-3 py-2" value={danceability} onChange={(e) => setDanceability(e.target.value)}>
              <option value="">All</option>
              <option value="danceable">Danceable</option>
              <option value="not_danceable">Not Danceable</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">BPM Range</label>
            <div className="flex gap-2">
              <input type="number" placeholder="Min" className="w-full border rounded px-3 py-2" value={bpmMin} onChange={(e) => setBpmMin(Number(e.target.value))} />
              <input type="number" placeholder="Max" className="w-full border rounded px-3 py-2" value={bpmMax} onChange={(e) => setBpmMax(Number(e.target.value))} />
            </div>
          </div>
        </div>

        <button
          onClick={generatePlaylist}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 active:scale-95 transition transform animate-pulse-button"
        >
          🎧 Generate Playlist
        </button>

        {loading && (
          <div className="mt-6 text-center">
            <span className="inline-block w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
            <p className="text-gray-600 mt-2">Loading songs...</p>
          </div>
        )}

        {filteredSongs.length > 0 && !loading && (
          <>
            <ul className="mt-6 space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {filteredSongs.map((song, index) => (
                <li
                  key={index}
                  className="bg-white border-l-4 border-indigo-500 rounded shadow p-4 transition hover:scale-[1.01] animate-fade-in"
                >
                  <p className="font-medium text-gray-800">
                    🎵 {song.track_name} - <span className="text-gray-600">{song.track_artist}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    BPM: {parseFloat(song.tempo).toFixed(1)} | Mood: {song.cluster} | Genre: {song.playlist_genre}
                  </p>
                </li>
              ))}
            </ul>

            <button
              className="mt-6 w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 active:scale-95 transition transform"
              onClick={handleCreatePlaylist}
            >
              ✅ Create Spotify Playlist
            </button>

            {playlistUrl && (
              <div className="mt-4 text-center">
                <p className="text-green-700 font-medium">✅ Playlist Created:</p>
                <a href={playlistUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  Open on Spotify
                </a>
              </div>
            )}
          </>
        )}

        {filteredSongs.length === 0 && !loading && (
          <p className="mt-6 text-gray-500 text-center">No songs match your selected filters.</p>
        )}
      </div>
    </div>
  );
}
