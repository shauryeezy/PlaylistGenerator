import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";


const urlParams = new URLSearchParams(window.location.search);
const accessToken = urlParams.get("access_token");

if (accessToken) {
  localStorage.setItem("spotify_access_token", accessToken);
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
