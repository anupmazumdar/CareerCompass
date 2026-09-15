# 15 Deterministic Test Scenarios for Hybrid Matching Engine

| Test ID | Scenario Description | Input Profile | Target Job Requirements | Expected Match Score Range | Validation Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Exact Full Match | Node.js, React, SQL, 3 yrs exp, B.Tech | Node.js, React, SQL, 3 yrs exp, B.Tech | **90% - 100%** | Perfect alignment across skills, experience, and education |
| **TC-02** | Missing Core Skill | React, SQL (Missing Node.js) | Node.js (Required), React, SQL | **45% - 60%** | Penalty applied for lacking mandatory primary skill |
| **TC-03** | Related Skill Match | React.js, Express.js, MongoDB | React, Node.js, NoSQL | **80% - 90%** | Taxonomy resolves aliases and parent categories |
| **TC-04** | Junior Applying to Senior | Python, Django, 1 yr exp | Python, Django, 5+ yrs exp | **50% - 65%** | Experience deficit reduces experience sub-score |
| **TC-05** | Senior Applying to Junior | Java, Spring, 7 yrs exp | Java, Spring, 1 yr exp | **85% - 95%** | Over-experience satisfies requirement with ceiling cap |
| **TC-06** | Zero Direct Skills | Photoshop, Figma, UI Design | Go, Kubernetes, Cloud | **10% - 25%** | Minimal baseline transferrable education match only |
| **TC-07** | Empty Candidate Profile | No skills, no experience listed | React, Node.js | **0% - 15%** | Graceful degradation without crash; returns baseline |
| **TC-08** | Case-Insensitive Matching| "REACT", "node.js", "Python" | "react", "Node.js", "python" | **90% - 100%** | String normalization handles varying casing |
| **TC-09** | Degree Type Alignment | B.Tech Computer Science | B.E. / B.Tech or equivalent | **Full Education Weight** | Equivalent engineering degree mapping |
| **TC-10** | Non-Technical Discipline| B.Com Accounting | B.Tech Computer Science | **Reduced Education Weight** | Non-aligned degree receives partial baseline weight |
| **TC-11** | Location Preference Match| Candidate: Bengaluru, Job: Bengaluru| Remote / Bengaluru | **Full Location Weight** | Exact location match awarded 100% for location factor |
| **TC-12** | Relocation Willing | Candidate: Kolkata, Relocation: Yes | Job: Mumbai | **80% Location Weight** | Willingness to relocate receives majority credit |
| **TC-13** | Certification Bonus | AWS Certified Solutions Architect | AWS Cloud Developer | **Bonus 5%** | Certified skill boosts sub-score category |
| **TC-14** | Project Portfolio Match | 3 Production GitHub repos in React | React Developer | **10% Project Boost**| Verifiable projects boost profile credibility |
| **TC-15** | Cross-Domain Candidate | Machine Learning engineer to Backend | Python, FastAPI, Docker | **70% - 80%** | Overlapping technical competencies recognized |
