import os
import csv
import chromadb

# --------------------------------------------------------
# Resolve Paths
# --------------------------------------------------------

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

# ingestion → vector_search → apps → backend → Syncode
SYNCODE_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "../../../.."))

CSV_PATH = os.path.join(SYNCODE_ROOT, "docs", "icd10cm_tabular_2026.csv")

print("Resolved CSV path:", CSV_PATH)
print("Exists:", os.path.exists(CSV_PATH))

if not os.path.exists(CSV_PATH):
    raise FileNotFoundError(f"CSV not found at: {CSV_PATH}")

# Chroma storage directory
CHROMA_DIR = os.path.join(SYNCODE_ROOT, "chromadb_store")
os.makedirs(CHROMA_DIR, exist_ok=True)

# --------------------------------------------------------
# Create Chroma persistent client (NEW API)
# --------------------------------------------------------
client = chromadb.PersistentClient(path=CHROMA_DIR)

collection = client.get_or_create_collection(
    name="icd10_codes"
)

# --------------------------------------------------------
# Load + ingest CSV
# --------------------------------------------------------

def load_icd10_to_chroma():
    print("Loading CSV...")

    ids = []
    texts = []
    metadatas = []

    with open(CSV_PATH, "r", encoding="latin1") as f:
        reader = csv.DictReader(f)

        for row in reader:
            code = row.get("Code")
            desc = row.get("Description")

            if not code or not desc:
                continue

            ids.append(code)
            texts.append(desc)
            metadatas.append({
                "code": code,
                "description": desc
            })

    print(f"Ingesting {len(ids)} ICD-10 codes...")

    collection.add(
        ids=ids,
        documents=texts,
        metadatas=metadatas
    )

    print("🎉 Done — ICD-10 codes stored in ChromaDB!")

if __name__ == "__main__":
    load_icd10_to_chroma()