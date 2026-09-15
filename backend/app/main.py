"""
backend/app/main.py
Unified TalentAI Machine Learning & Matching Micro-Engine
FastAPI Service providing TF-IDF similarity, NLP extraction, and Python ML bridge
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

app = FastAPI(title="TalentAI Unified ML Engine", description="Hybrid Semantic & TF-IDF Scoring", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class MatchRequest(BaseModel):
    resume_text: str
    job_description: str

class MatchResponse(BaseModel):
    score: float
    percentage: int
    label: str

def compute_match_score(resume_text: str, job_description: str) -> tuple:
    resume_text = str(resume_text or "").strip()
    job_description = str(job_description or "").strip()
    if not resume_text or not job_description:
        return 0.0, 0, "Invalid Input"
    try:
        vectorizer = TfidfVectorizer(lowercase=True, stop_words='english', ngram_range=(1, 2), min_df=1, max_df=1.0)
        tfidf_matrix = vectorizer.fit_transform([resume_text, job_description])
        similarity = cosine_similarity(tfidf_matrix[0], tfidf_matrix[1])[0][0]
        score = float(np.clip(similarity, 0.0, 1.0))
        pct = int(round(score * 100))
        if pct >= 75:
            label = "Excellent Match"
        elif pct >= 50:
            label = "Good Match"
        else:
            label = "Needs Skill Alignment"
        return score, pct, label
    except Exception as e:
        return 0.0, 0, f"Error: {str(e)}"

@app.post("/match", response_model=MatchResponse)
async def match_resume_to_job(request: MatchRequest):
    try:
        score, pct, label = compute_match_score(request.resume_text, request.job_description)
        return MatchResponse(score=score, percentage=pct, label=label)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Match computation failed: {str(e)}")

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "TalentAI Python ML Engine",
        "version": "2.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
