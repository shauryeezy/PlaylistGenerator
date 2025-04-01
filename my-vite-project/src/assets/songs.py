import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import AgglomerativeClustering
from sklearn.decomposition import PCA
import matplotlib.pyplot as plt

# Load the dataset
df = pd.read_csv("my-vite-project/src/assets/spotify_songs.csv")

# Select audio feature columns
features = [
    "danceability", "energy", "loudness", "speechiness",
    "acousticness", "instrumentalness", "liveness", "valence", "tempo"
]

X = df[features].dropna()

# Scale the features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Clustering with Agglomerative
k = 4
model = AgglomerativeClustering(n_clusters=k)
df["cluster"] = model.fit_predict(X_scaled)

# 🎭 Map clusters to mood labels
cluster_to_mood = {
    0: "Chill",
    1: "Happy",
    2: "Energetic",
    3: "Sad"
}
df["mood"] = df["cluster"].map(cluster_to_mood)

# PCA for visualization
pca = PCA(n_components=2)
pca_result = pca.fit_transform(X_scaled)
df["pca1"] = pca_result[:, 0]
df["pca2"] = pca_result[:, 1]

# Plotting
plt.figure(figsize=(10, 7))
for cluster_num in range(k):
    subset = df[df["cluster"] == cluster_num]
    plt.scatter(subset["pca1"], subset["pca2"], label=cluster_to_mood[cluster_num], alpha=0.6)

plt.title("Spotify Songs Clustered by Mood (Agglomerative + PCA)")
plt.xlabel("PCA Component 1")
plt.ylabel("PCA Component 2")
plt.legend()
plt.grid(True)
plt.tight_layout()
plt.savefig("cluster_plot.png")
plt.show()

# Save final dataset
df.to_csv("clustered_spotify_songs1.csv", index=False)

# Print sample songs per mood
for mood in df["mood"].unique():
    print(f"\n🎧 Mood: {mood} Sample Songs:")
    print(df[df["mood"] == mood][[
        "track_name", "track_artist", "valence", "energy", "playlist_genre", "playlist_subgenre"
    ]].head(5))
