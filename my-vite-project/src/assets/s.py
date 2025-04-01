import os
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering
from sklearn.metrics import silhouette_score, davies_bouldin_score
import matplotlib.pyplot as plt
import seaborn as sns

# Print to confirm script is running
print("🔍 Running clustering model comparison...")

# Build full CSV path (robust)
base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
csv_path = os.path.join(base_dir, "clustered_spotify_songs.csv")

# Load dataset
df = pd.read_csv(csv_path)

# Select features
features = ["danceability", "energy", "loudness", "speechiness",
            "acousticness", "instrumentalness", "liveness", "valence", "tempo"]
X = df[features].dropna()

# Scale data
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Train models and collect metrics
def train_and_evaluate_model(model, name):
    labels = model.fit_predict(X_scaled)
    silhouette = silhouette_score(X_scaled, labels)
    db_index = davies_bouldin_score(X_scaled, labels)
    return {
        "Model": name,
        "Silhouette Score": silhouette,
        "Davies-Bouldin Index": db_index,
        "Labels": labels
    }

results = [
    train_and_evaluate_model(KMeans(n_clusters=4, random_state=42), "KMeans"),
    train_and_evaluate_model(DBSCAN(eps=1.2, min_samples=5), "DBSCAN"),
    train_and_evaluate_model(AgglomerativeClustering(n_clusters=4, linkage='average'), "Agglomerative")
]

# PCA for plotting
pca = PCA(n_components=2)
X_pca = pca.fit_transform(X_scaled)

# Save plots to local directory
plot_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "plots"))
os.makedirs(plot_dir, exist_ok=True)

for res in results:
    df_plot = pd.DataFrame(X_pca, columns=["pca1", "pca2"])
    df_plot["label"] = res["Labels"]
    plt.figure(figsize=(8, 6))
    sns.scatterplot(data=df_plot, x="pca1", y="pca2", hue="label", palette="Set2", s=30)
    plt.title(f"{res['Model']} Clustering (PCA)")
    plt.savefig(os.path.join(plot_dir, f"{res['Model']}_PCA.png"))
    plt.close()

# Print summary
summary_df = pd.DataFrame([{
    "Model": res["Model"],
    "Silhouette Score": round(res["Silhouette Score"], 3),
    "Davies-Bouldin Index": round(res["Davies-Bouldin Index"], 3)
} for res in results])

print("\n📊 Clustering Model Comparison:")
print(summary_df.to_string(index=False))
print(f"\n✅ PCA plots saved in: {plot_dir}")
