// App.jsx
import React from "react";
import PlaylistGenerator from "./components/playlists";

function App() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-center mt-4">DISCOVER NEW MUSIC!</h1>
      <PlaylistGenerator />
    </div>
  );
}

export default App;
