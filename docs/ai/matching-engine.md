# Matching Engine Specification: Two-Way Hybrid Deterministic Engine

## 1. Mathematical Formulation

The matching score $S(c, j) \in [0, 100]$ calculates compatibility between candidate profile $c$ and job specification $j$:

$$S(c, j) = w_{\text{skill}} S_{\text{skill}} + w_{\text{exp}} S_{\text{exp}} + w_{\text{edu}} S_{\text{edu}} + w_{\text{proj}} S_{\text{proj}} + w_{\text{loc}} S_{\text{loc}} + w_{\text{cert}} S_{\text{cert}}$$

Where weights strictly satisfy $\sum w_i = 1.0$:
- **Skills ($w_{\text{skill}} = 0.40$)**: Required skills (weight 1.0) and preferred skills (weight 0.5) matched against student skills and resolved taxonomy aliases.
- **Experience ($w_{\text{exp}} = 0.20$)**: Evaluates candidate experience years against $j_{\text{minExp}}$.
- **Education ($w_{\text{edu}} = 0.15$)**: Degree alignment (e.g., Computer Science, Engineering).
- **Projects ($w_{\text{proj}} = 0.10$)**: Verified repository and project portfolio relevance.
- **Location ($w_{\text{loc}} = 0.10$)**: Remote flexibility, direct city match, or relocation willingness.
- **Certifications ($w_{\text{cert}} = 0.05$)**: Accredited industry certifications.

## 2. Two-Way Reusability
The same underlying matching engine powers:
1. **Student View**: Ranks recommended jobs descending by match score.
2. **Recruiter View**: Ranks job applicants descending by match score, presenting transparent explanations of strengths and gaps.
