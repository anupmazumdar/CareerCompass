'use strict';

const skillRepo = require('../../repositories/skillRepository');

const DEFAULT_WEIGHTS = {
  skill: 0.40,
  experience: 0.20,
  education: 0.15,
  project: 0.10,
  location: 0.10,
  certification: 0.05
};

const EDUCATION_HIERARCHY = {
  'any': 0,
  'none': 0,
  'diploma': 1,
  'bachelor': 2,
  'master': 3,
  'doctorate': 4,
  'phd': 4
};

function parseDegreeLevel(degreeStr = '') {
  const d = String(degreeStr || '').toLowerCase();
  if (d.includes('phd') || d.includes('doctorate')) return 4;
  if (d.includes('master') || d.includes('mca') || d.includes('m.tech') || d.includes('m.sc') || d.includes('mba')) return 3;
  if (d.includes('bachelor') || d.includes('b.tech') || d.includes('bca') || d.includes('b.sc') || d.includes('b.e')) return 2;
  if (d.includes('diploma')) return 1;
  return 1;
}

class MatchingEngine {
  constructor(weights = DEFAULT_WEIGHTS) {
    this.weights = { ...DEFAULT_WEIGHTS, ...weights };
  }

  /**
   * Two-way hybrid explainable matching computation.
   * @param {Object} candidateProfile Student profile with education, experience, projects, skills
   * @param {Object} job Job entity with required/preferred skills, education, location, experience
   * @returns {Object} Deterministic match evaluation and explanation
   */
  async computeMatch(candidateProfile = {}, job = {}) {
    const candidateId = candidateProfile.id || null;
    const jobId = job.id || null;

    // 1. Skill Matching
    const skillResult = await this.evaluateSkills(candidateProfile.skills || [], job.skills || []);

    // 2. Experience Matching
    const expResult = this.evaluateExperience(candidateProfile.experience || [], job.min_experience_years || 0);

    // 3. Education Matching
    const eduResult = this.evaluateEducation(candidateProfile.education || [], job.min_education || 'Bachelor');

    // 4. Project Relevance
    const projResult = this.evaluateProjects(candidateProfile.projects || [], job.skills || []);

    // 5. Location & Preference
    const locResult = this.evaluateLocation(candidateProfile, job);

    // 6. Certification Match
    const certResult = this.evaluateCertifications(candidateProfile.certifications || [], job.skills || []);

    // Weighted Final Score
    const finalScore = Number((
      this.weights.skill * skillResult.score +
      this.weights.experience * expResult.score +
      this.weights.education * eduResult.score +
      this.weights.project * projResult.score +
      this.weights.location * locResult.score +
      this.weights.certification * certResult.score
    ).toFixed(1));

    // Grade assignment
    let grade = 'F';
    if (finalScore >= 90) grade = 'A';
    else if (finalScore >= 80) grade = 'B';
    else if (finalScore >= 68) grade = 'C';
    else if (finalScore >= 50) grade = 'D';

    // Formulate human-readable explanation
    const explanation = this.generateExplanation({
      finalScore,
      grade,
      jobTitle: job.title || 'Position',
      skillResult,
      expResult,
      eduResult,
      projResult
    });

    return {
      candidate_id: candidateId,
      job_id: jobId,
      job_title: job.title || '',
      final_score: Math.min(100, Math.max(0, finalScore)),
      grade,
      breakdown: {
        skill_score: skillResult.score,
        experience_score: expResult.score,
        education_score: eduResult.score,
        project_score: projResult.score,
        location_score: locResult.score,
        certification_score: certResult.score
      },
      weights_used: this.weights,
      matched_skills: skillResult.matched,
      partial_skills: skillResult.partial,
      missing_skills: skillResult.missing,
      explanation,
      calculated_at: new Date().toISOString()
    };
  }

  async evaluateSkills(candidateSkills = [], jobSkills = []) {
    if (!jobSkills || jobSkills.length === 0) {
      return { score: 100, matched: [], partial: [], missing: [] };
    }

    const matched = [];
    const partial = [];
    const missing = [];

    // Map candidate skills by canonical lowercase
    const candSkillSet = new Map();
    for (const cs of candidateSkills) {
      const name = (cs.canonical_name || cs.name || '').toLowerCase().trim();
      if (name) candSkillSet.set(name, cs);
    }

    let totalWeightedPoints = 0;
    let maxPossiblePoints = 0;

    for (const js of jobSkills) {
      const reqWeight = js.is_required ? 1.0 : 0.5;
      maxPossiblePoints += reqWeight;

      const jsName = (js.canonical_name || js.name || '').toLowerCase().trim();

      // Check 1: Exact canonical match
      if (candSkillSet.has(jsName)) {
        totalWeightedPoints += 1.0 * reqWeight;
        matched.push({
          skill: js.canonical_name || js.name,
          type: 'exact',
          is_required: Boolean(js.is_required)
        });
        continue;
      }

      // Check 2: Taxonomy hierarchy (parent/child)
      const canonicalJobSkill = await skillRepo.resolveCanonical(jsName);
      let foundRelationship = false;

      if (canonicalJobSkill) {
        for (const [candName] of candSkillSet) {
          const canonicalCandSkill = await skillRepo.resolveCanonical(candName);
          if (!canonicalCandSkill) continue;

          // Case A: Candidate has child framework (e.g. React) and Job requires parent (JavaScript) -> Derived (0.8)
          if (canonicalCandSkill.parent_skill_id === canonicalJobSkill.id) {
            totalWeightedPoints += 0.8 * reqWeight;
            matched.push({
              skill: js.canonical_name || js.name,
              type: 'derived',
              derived_from: canonicalCandSkill.canonical_name,
              is_required: Boolean(js.is_required)
            });
            foundRelationship = true;
            break;
          }

          // Case B: Candidate has parent (e.g. SQL) and Job requires specific child (PostgreSQL) -> Partial (0.6)
          if (canonicalJobSkill.parent_skill_id === canonicalCandSkill.id) {
            totalWeightedPoints += 0.6 * reqWeight;
            partial.push({
              required: js.canonical_name || js.name,
              possessed: canonicalCandSkill.canonical_name,
              match_ratio: 0.6,
              reason: `Foundational knowledge in ${canonicalCandSkill.canonical_name}`
            });
            foundRelationship = true;
            break;
          }
        }
      }

      if (!foundRelationship) {
        missing.push({
          skill: js.canonical_name || js.name,
          is_required: Boolean(js.is_required)
        });
      }
    }

    const score = maxPossiblePoints > 0 ? Number(((totalWeightedPoints / maxPossiblePoints) * 100).toFixed(1)) : 100;
    return { score, matched, partial, missing };
  }

  evaluateExperience(experienceList = [], requiredYears = 0) {
    if (requiredYears <= 0) return { score: 100, years: 0 };

    // Estimate total years from experience entries
    let totalYears = 0;
    for (const exp of experienceList) {
      if (exp.start_date) {
        const start = new Date(exp.start_date).getFullYear();
        const end = exp.is_current ? new Date().getFullYear() : (new Date(exp.end_date || Date.now()).getFullYear());
        totalYears += Math.max(0.5, end - start);
      } else {
        totalYears += 1;
      }
    }

    if (totalYears >= requiredYears) {
      return { score: 100, years: totalYears };
    }

    // Graduated partial credit
    const score = Number(Math.min(100, (totalYears / requiredYears) * 85).toFixed(1));
    return { score, years: totalYears };
  }

  evaluateEducation(educationList = [], minEducation = 'Bachelor') {
    const requiredLevel = EDUCATION_HIERARCHY[String(minEducation).toLowerCase()] || 2;
    if (requiredLevel === 0) return { score: 100 };

    let candidateHighestLevel = 1;
    for (const edu of educationList) {
      const level = parseDegreeLevel(edu.degree);
      if (level > candidateHighestLevel) candidateHighestLevel = level;
    }

    if (candidateHighestLevel >= requiredLevel) {
      return { score: 100, candidateLevel: candidateHighestLevel, requiredLevel };
    } else if (candidateHighestLevel === requiredLevel - 1) {
      return { score: 65, candidateLevel: candidateHighestLevel, requiredLevel };
    }
    return { score: 30, candidateLevel: candidateHighestLevel, requiredLevel };
  }

  evaluateProjects(projectList = [], jobSkills = []) {
    if (!jobSkills || jobSkills.length === 0 || !projectList || projectList.length === 0) {
      return { score: 50 };
    }

    const projectTechs = new Set();
    for (const proj of projectList) {
      const techs = Array.isArray(proj.technologies) ? proj.technologies : [];
      for (const t of techs) projectTechs.add(String(t).toLowerCase());
    }

    let matchCount = 0;
    for (const js of jobSkills) {
      const name = (js.canonical_name || js.name || '').toLowerCase();
      if (projectTechs.has(name)) matchCount++;
    }

    const ratio = matchCount / Math.max(1, Math.min(5, jobSkills.length));
    const score = Math.min(100, Math.round(ratio * 100));
    return { score: Math.max(20, score) };
  }

  evaluateLocation(candidate = {}, job = {}) {
    const jobLoc = String(job.location || '').toLowerCase();
    const candLoc = String(candidate.location || '').toLowerCase();
    const candPref = String(candidate.preferred_location || '').toLowerCase();

    if (jobLoc.includes('remote')) return { score: 100 };
    if (candLoc && jobLoc.includes(candLoc)) return { score: 100 };
    if (candPref && jobLoc.includes(candPref)) return { score: 85 };
    return { score: 50 };
  }

  evaluateCertifications(certList = [], jobSkills = []) {
    if (!certList || certList.length === 0) return { score: 20 };
    return { score: Math.min(100, 20 + certList.length * 40) };
  }

  generateExplanation({ finalScore, grade, jobTitle, skillResult, expResult, eduResult }) {
    const matchedCount = skillResult.matched.length;
    const totalRequired = skillResult.matched.length + skillResult.missing.length;
    const parts = [
      `Overall fit for ${jobTitle} is ${finalScore}% (Grade ${grade}).`,
      `Skill Alignment: Matched ${matchedCount} of ${totalRequired} key skills.`
    ];

    if (skillResult.missing.length > 0) {
      const missingNames = skillResult.missing.slice(0, 3).map(m => m.skill).join(', ');
      parts.push(`Skill Gaps: Consider upskilling in ${missingNames}.`);
    }

    if (expResult.score === 100) {
      parts.push('Experience requirements are fully satisfied.');
    } else {
      parts.push(`Experience: Candidate has approx ${expResult.years} yrs relevant background.`);
    }

    if (eduResult.score === 100) {
      parts.push('Academic qualifications fulfill the required degree level.');
    }

    return parts.join(' ');
  }
}

module.exports = new MatchingEngine();
module.exports.MatchingEngine = MatchingEngine;
module.exports.DEFAULT_WEIGHTS = DEFAULT_WEIGHTS;
