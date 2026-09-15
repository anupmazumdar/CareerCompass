# Matching Engine Specification: Explainable Hybrid Two-Way Matching

**Lead Author**: Agent 1 (Architect / Tech Lead)
**Contributors**: Agent 2 (Backend), Agent 6 (QA / Testing)
**Status**: Proposal for Review
**Document Path**: `docs/architecture/matching-engine.md`

---

## 1. Architectural Principles

The Matching Engine is the core intelligence component of the unified platform. In strict accordance with the product vision:

1. **NO Black-Box Opaque Scoring**: Matching is NOT implemented purely as an unexplainable LLM prompt or raw `cosine_similarity(embedding1, embedding2)`.
2. **Deterministic & Explainable**: Both students and recruiters must receive clear, transparent, actionable explanations for why a match score was awarded (e.g. "Matched 4 of 5 required skills; Bachelor's degree fulfills education requirement; 0.5 years experience under minimum of 1.0 years").
3. **True Two-Way Symmetrical Operation**: The **exact same engine** powers:
   * **Student View**: Finding and ranking matching job opportunities.
   * **Recruiter View**: Finding and ranking matching candidates for a job.
4. **Configurable Weighting Architecture**: Default weights are maintained in a configurable policy object, allowing adjustments without modifying code.

---

## 2. Mathematical Scoring Model

The final match score $S_{final} \in [0, 100]$ is computed as a linear combination of normalized component scores:

$$S_{final} = w_{skill} \cdot S_{skill} + w_{exp} \cdot S_{exp} + w_{edu} \cdot S_{edu} + w_{proj} \cdot S_{proj} + w_{loc} \cdot S_{loc} + w_{cert} \cdot S_{cert}$$

### Default Configurable Weights

 | Component | Default Weight | Key Factors Evaluated | 
 | :--- | :--- | :--- | 
 | **Skill Match ($S_{skill}$)** | **0.40 (40%)** | Canonical exact matches, alias resolution, parent/child taxonomy relationships, mandatory vs preferred requirements. | 
 | **Experience Match ($S_{exp}$)** | **0.20 (20%)** | Total verified years of relevant work/internship experience vs job's `min_experience_years`. | 
 | **Education Match ($S_{edu}$)** | **0.15 (15%)** | Degree level hierarchy (Diploma < Bachelor < Master < PhD) and field of study alignment. | 
 | **Project Relevance ($S_{proj}$)** | **0.10 (10%)** | Technologies used in student projects matching job required/preferred skills. | 
 | **Location / Work Mode ($S_{loc}$)** | **0.10 (10%)** | Geographic proximity or alignment with remote/hybrid preferences. | 
 | **Certifications ($S_{cert}$)** | **0.05 (5%)** | Industry-standard certifications relevant to required skills. | 

$$\sum w_i = 0.40 + 0.20 + 0.15 + 0.10 + 0.10 + 0.05 = 1.00$$

---

## 3. Skill Taxonomy & Match Resolution Logic

Skills are first normalized to their **canonical representation** via the Skill Taxonomy:

* `JS`, `Javascript`, `ECMAScript` $\rightarrow$ `JavaScript`
* `ReactJS`, `React.js` $\rightarrow$ `React` (Child of `JavaScript`)
* `Postgres`, `PostgreSQL` $\rightarrow$ `PostgreSQL` (Child of `SQL`)

### Skill Comparison Categories

For each skill required or preferred by a job posting:

1. **EXACT MATCH (Weight: 1.0)**:
   The candidate possesses the exact canonical skill (e.g. Job requires `Python`; Candidate has `Python`).

2. **PARTIAL / RELATED MATCH (Weight: 0.6)**:
   The candidate possesses a related skill in the same taxonomy subtree, or an ancestor skill (e.g. Job requires `PostgreSQL`; Candidate has generic `SQL`).

3. **DERIVED MATCH (Weight: 0.8)**:
   The candidate possesses a specialized child framework that implies knowledge of the parent technology (e.g. Job requires `JavaScript`; Candidate has `React` or `Next.js`).

4. **MISSING SKILL (Weight: 0.0)**:
   The candidate does not possess the skill or any taxonomy equivalent.

### Skill Score Formula ($S_{skill}$)

$$S_{skill} = 100 \times \left( 0.70 \times \frac{\sum_{req} Score(s)}{N_{req}} + 0.30 \times \frac{\sum_{pref} Score(s)}{N_{pref}} \right)$$

*If a job defines no preferred skills, mandatory required skills account for 100% of the skill score.*

---

## 4. Sub-Score Evaluation Details

### 4.1 Experience Score ($S_{exp}$)

* If $Years_{candidate} \ge Years_{required}$: $S_{exp} = 100$.
* If $Years_{candidate} < Years_{required}$:
  $$S_{exp} = 100 \times \left( \frac{Years_{candidate}}{Years_{required}} \right) \times 0.85$$
  *(Graduated penalty ensuring near-qualifications still receive partial credit).*

* If $Years_{required} == 0$ (Entry level / Freshers): $S_{exp} = 100$.

### 4.2 Education Score ($S_{edu}$)

Education levels are mapped to ordinal values:

* `Any / None`: 0
* `Diploma`: 1
* `Bachelor` (B.Tech, BCA, B.Sc): 2
* `Master` (M.Tech, MCA, M.Sc): 3
* `Doctorate` (PhD): 4

* If $Level_{candidate} \ge Level_{required}$: $S_{edu} = 100$.
* If $Level_{candidate} == Level_{required} - 1$: $S_{edu} = 65$.
* Otherwise: $S_{edu} = 30$.

### 4.3 Project Relevance ($S_{proj}$)

* Evaluates the proportion of job skills demonstrated in the candidate's actual projects:
  $$S_{proj} = 100 \times \min\left(1.0, \frac{\text{Unique Project Skills Matched}}{\max(1, \text{Job Skills})}\right)$$

### 4.4 Location & Work Mode ($S_{loc}$)

* If Job is `Remote`: $S_{loc} = 100$.
* If Candidate location matches Job location: $S_{loc} = 100$.
* If Candidate preferred location includes Job location: $S_{loc} = 85$.
* Otherwise: $S_{loc} = 40$.

### 4.5 Certification Score ($S_{cert}$)

* Awarded based on verified industry credentials matching job domain:
  * 1 or more relevant certifications: $S_{cert} = 100$.
  * Certified in related domain: $S_{cert} = 60$.
  * No certifications: $S_{cert} = 20$.

---

## 5. Output Contract & Diagnostic Schema

```json
{
  "candidate_id": 142,
  "job_id": 18,
  "job_title": "Full Stack Engineer",
  "final_score": 81.5,
  "grade": "B",
  "breakdown": {
    "skill_score": 85.0,
    "experience_score": 80.0,
    "education_score": 100.0,
    "project_score": 75.0,
    "location_score": 85.0,
    "certification_score": 60.0
  },
  "weights_used": {
    "skill": 0.40,
    "experience": 0.20,
    "education": 0.15,
    "project": 0.10,
    "location": 0.10,
    "certification": 0.05
  },
  "matched_skills": [
    { "skill": "Python", "type": "exact", "source": "verified_skills" },
    { "skill": "FastAPI", "type": "exact", "source": "resume" },
    { "skill": "Docker", "type": "exact", "source": "projects" },
    { "skill": "Git", "type": "exact", "source": "resume" }
  ],
  "partial_skills": [
    { "required": "PostgreSQL", "possessed": "SQL", "match_ratio": 0.6, "reason": "Candidate has foundational SQL knowledge" }
  ],
  "missing_skills": [
    { "skill": "AWS", "is_required": true }
  ],
  "explanation": "Candidate is an 81.5% match for Full Stack Engineer. Strong proficiency in core backend stack (Python, FastAPI, Docker, Git). Possesses relational database foundation (SQL) that partially satisfies PostgreSQL requirement. Missing required cloud infrastructure experience (AWS). Master's degree (MCA) exceeds educational minimum.",
  "calculated_at": "2026-09-15T14:30:00.000Z"
}

```

---

## 6. Deterministic Test Suite Matrix

The QA Agent (Agent 6) validates the engine across 15 deterministic scenarios:

 | # | Test Case | Inputs | Expected Outcome | 
 | :---: | :--- | :--- | :--- | 
 | 1 | **Exact Match** | Candidate possesses all required skills, experience, education | Final Score $\ge 95\%$, zero missing skills | 
 | 2 | **Zero Skill Match** | Candidate has completely disjoint skill set | Skill Score $= 0\%$, Final Score reflects only education/location baseline | 
 | 3 | **Partial Skill Match** | Candidate has `SQL`, Job requires `PostgreSQL` | `SQL` mapped to `partial_skills` with 0.6 weight | 
 | 4 | **Derived Skill Match** | Candidate has `React`, Job requires `JavaScript` | `React` mapped as derived match with 0.8 weight | 
 | 5 | **Missing Required Skill** | Candidate misses `AWS`, has all others | `AWS` in `missing_skills`, overall score penalized | 
 | 6 | **Education Mismatch** | Job requires `Master`, Candidate has `Diploma` | Education Score reduced to 30%, explanation notes gap | 
 | 7 | **Experience Mismatch** | Job requires 3 years, Candidate has 1 year | Experience Score reduced to $56.6\%$, noted in explanation | 
 | 8 | **Location Mismatch** | On-site in Bangalore, Candidate in Delhi (no relocation) | Location Score $= 40\%$ | 
 | 9 | **Empty Profile** | New student with no skills, education, or projects | Final Score $= 0\%$, graceful error-free result | 
 | 10 | **Job With No Skills** | Edge case: Job description has empty skills array | Returns 100% skill score floor with warning | 
 | 11 | **No Resume Attached** | Candidate has profile data but no uploaded resume | Evaluates purely on structured profile entities | 
 | 12 | **Duplicate Skills** | Candidate profile lists `Python` 3 times | Deduplicated to single canonical `Python` entry | 
 | 13 | **Skill Aliases** | Candidate has `JS`, Job requires `JavaScript` | Normalizes to `JavaScript` as 1.0 exact match | 
 | 14 | **Expired Job** | Job deadline in past | Excluded from recommendations automatically | 
 | 15 | **Closed Job** | Job status = `closed` | Excluded from recommendations automatically | 
