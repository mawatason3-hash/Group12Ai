import hashlib
import json
from pathlib import Path

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer

BASE_DIR = Path(__file__).resolve().parent
MEMBERS_PATH = BASE_DIR / "data" / "members.json"
MODEL_PATH = BASE_DIR / "model" / "tfidf.pkl"


def member_documents(member: dict) -> list[str]:
    identity = [member.get("fullName", ""), *member.get("aliases", [])]
    role = [member.get("role", ""), *member.get("skills", [])]
    work = [
        member.get("targetUser", ""),
        member.get("problem", ""),
        member.get("contribution", ""),
        member.get("feature", ""),
        member.get("outcomeMetric", ""),
    ]
    return [" ".join(value for value in section if value) for section in (identity, role, work)]


def build_index() -> dict:
    raw = MEMBERS_PATH.read_bytes()
    members = json.loads(raw)
    if not members:
        raise ValueError("members.json must contain at least one member")

    documents = []
    document_member_indices = []
    for member_index, member in enumerate(members):
        sections = member_documents(member)
        documents.extend(sections)
        document_member_indices.extend([member_index] * len(sections))

    vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
    matrix = vectorizer.fit_transform(documents)
    fingerprint = hashlib.sha256(raw).hexdigest()

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {
            "vectorizer": vectorizer,
            "matrix": matrix,
            "document_member_indices": document_member_indices,
            "fingerprint": fingerprint,
        },
        MODEL_PATH,
    )
    return {"memberCount": len(members), "fingerprint": fingerprint}


if __name__ == "__main__":
    result = build_index()
    print(f"Built TF-IDF index for {result['memberCount']} members ({result['fingerprint']})")
