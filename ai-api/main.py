import hashlib
import json
from pathlib import Path
from typing import Any

import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.metrics.pairwise import cosine_similarity

from build_index import BASE_DIR, MODEL_PATH, build_index

MEMBERS_PATH = BASE_DIR / "data" / "members.json"
MATCH_THRESHOLD = 0.45

app = FastAPI(title="AgriSoko Pocket G12 API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AskRequest(BaseModel):
    query: str = Field(min_length=1, max_length=1000)


def load_members() -> list[dict[str, Any]]:
    return json.loads(MEMBERS_PATH.read_text(encoding="utf-8"))


def load_model() -> dict[str, Any]:
    fingerprint = hashlib.sha256(MEMBERS_PATH.read_bytes()).hexdigest()
    if MODEL_PATH.exists():
        model = joblib.load(MODEL_PATH)
        if (
            model.get("fingerprint") == fingerprint
            and "document_member_indices" in model
        ):
            return model
    build_index()
    return joblib.load(MODEL_PATH)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/members")
def get_members() -> list[dict[str, Any]]:
    return load_members()


@app.get("/members/{member_id}")
def get_member(member_id: str) -> dict[str, Any]:
    for member in load_members():
        if member["id"] == member_id:
            return member
    raise HTTPException(status_code=404, detail="Member not found")


@app.post("/ask")
def ask(request: AskRequest) -> dict[str, Any]:
    model = load_model()
    members = load_members()
    query_vector = model["vectorizer"].transform([request.query])
    document_scores = cosine_similarity(query_vector, model["matrix"]).flatten()
    scores = [0.0] * len(members)
    for document_index, member_index in enumerate(model["document_member_indices"]):
        scores[member_index] = max(scores[member_index], float(document_scores[document_index]))
    best_index = max(range(len(scores)), key=scores.__getitem__)
    score = scores[best_index]
    if score < MATCH_THRESHOLD:
        return {
            "matched": False,
            "score": score,
            "threshold": MATCH_THRESHOLD,
            "reason": "No team member matched your question with enough confidence.",
        }

    member = members[best_index]
    return {
        "matched": True,
        "score": score,
        "threshold": MATCH_THRESHOLD,
        "member": member,
        "introduction": member["introductionDraft"],
        "reason": f"Your question is relevant to {member['fullName']}'s {member['role']} work.",
    }


@app.get("/model-info")
def model_info() -> dict[str, Any]:
    model = load_model()
    return {
        "fingerprint": model["fingerprint"],
        "memberCount": len(load_members()),
        "threshold": MATCH_THRESHOLD,
        "modelPath": str(Path(MODEL_PATH).relative_to(BASE_DIR)),
    }
