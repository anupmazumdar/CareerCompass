'use strict';

const studentRepo = require('../repositories/studentRepository');
const appRepo = require('../repositories/applicationRepository');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Ranked free-tier models verified on OpenRouter catalog
const FREE_MODELS_FALLBACK_CHAIN = [
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'google/gemma-4-26b-a4b-it:free',
  'nex-agi/nex-n2.5-pro:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'openrouter/free'
];

function getOpenRouterApiKey() {
  return process.env.OPENROUTER_API_KEY || process.env.REACT_APP_OPENROUTER_API_KEY || '';
}

/**
 * Builds grounded system prompt from verified student profile & application pipeline.
 */
function buildGroundedSystemPrompt(studentProfile, applications) {
  const skillsList = (studentProfile.skills || [])
    .map(s => `${s.skill_name || s.canonical_name} (${s.proficiency_level || 'intermediate'})`)
    .join(', ') || 'No skills added yet';

  const educationList = (studentProfile.education || [])
    .map(e => `${e.degree} in ${e.field_of_study || 'IT'} from ${e.institution} (${e.start_year}-${e.end_year || 'Present'}, Grade: ${e.grade_or_cgpa || 'N/A'})`)
    .join('; ') || 'No formal education records listed';

  const projectsList = (studentProfile.projects || [])
    .map(p => {
      let techs = '';
      try {
        const parsed = typeof p.technologies === 'string' ? JSON.parse(p.technologies) : p.technologies;
        if (Array.isArray(parsed)) techs = ` [Tech: ${parsed.join(', ')}]`;
      } catch (_) {}
      return `"${p.title}" - ${p.description || ''}${techs}`;
    })
    .join('; ') || 'No projects listed';

  const certsList = (studentProfile.certifications || [])
    .map(c => `${c.title} by ${c.issuing_organization}`)
    .join(', ') || 'No certifications added yet';

  const appPipeline = (applications || [])
    .map(a => `${a.job_title} at ${a.company_name} (Status: ${a.status}${a.match_score ? `, Match: ${Math.round(a.match_score)}%` : ''})`)
    .join('; ') || 'No active applications in pipeline';

  return `You are CareerPath AI, an expert, encouraging, yet rigorous technical career advisor and mentor assisting Master of Computer Applications (MCA) and Computer Science students.

STRICT GROUNDING DIRECTIVE:
1. Ground all feedback, critique, resume suggestions, and interview prep in the student's ACTUAL verified profile data provided below.
2. NEVER hallucinate achievements, skills, degrees, or company names the student does not have.
3. If the student asks about a role or skill they haven't learned, explicitly identify the gap and provide a concrete, step-by-step roadmap to acquire it.
4. Tone: Professional, direct, supportive, and realistic. Use Markdown (bold headers, bullet points, code snippets where applicable). Keep responses concise (under 350 words) unless a deep resume review or long interview answer is requested.

STUDENT PROFILE:
- Full Name: ${studentProfile.full_name || 'Student'}
- Professional Headline: ${studentProfile.headline || 'MCA Student'}
- Target / Preferred Role: ${studentProfile.preferred_role || 'Full-Stack Developer'}
- Profile Completeness: ${studentProfile.completeness_score || 0}%
- Verified Skills: ${skillsList}
- Academic Education: ${educationList}
- Technical Projects: ${projectsList}
- Certifications: ${certsList}
- Current Application Pipeline: ${appPipeline}`;
}

/**
 * Intelligent fallback generator if OpenRouter is unreachable or quota exhausted.
 */
function generateLocalGroundedAdvice(userQuery, studentProfile, applications) {
  const query = String(userQuery || '').toLowerCase();
  const skills = (studentProfile.skills || []).map(s => s.skill_name || s.canonical_name);
  const targetRole = studentProfile.preferred_role || 'Full-Stack Developer';

  if (query.includes('match') || query.includes('score') || query.includes('improve')) {
    return `### CareerPath Match Score Improvement Strategy

Hello **${studentProfile.full_name || 'Student'}**, based on your target role (**${targetRole}**) and current profile completeness (**${studentProfile.completeness_score || 0}%**):

1. **Expand Verified Skills**: You currently have **${skills.length} skills** (${skills.slice(0, 5).join(', ')}). Recruiters on CareerPath prioritize candidates with both core languages and container/cloud tools.
2. **Project Depth**: Ensure each project highlights measurable impact, architecture, and technology tags.
3. **Targeted Applications**: Align your projects with the requirements of the **${applications.length} opportunities** currently in your pipeline.`;
  }

  if (query.includes('interview') || query.includes('prepare') || query.includes('question')) {
    return `### Targeted Interview Preparation

Hello **${studentProfile.full_name || 'Student'}**, to prepare effectively for your campus and off-campus recruitment rounds:

1. **STAR Technique for Your Projects**:
${(studentProfile.projects || []).slice(0, 2).map(p => `   - **${p.title}**: Explain the Situation, Task, your architectural Action, and the Resulting performance.`).join('\n') || '   - Prepare 2 deep-dive project stories highlighting technical challenges you resolved.'}
2. **Core Fundamentals**: Focus heavily on Data Structures, Database Indexing, and REST API design patterns.
3. **Pipeline Status**: You currently have **${applications.length} applications** in your pipeline. Make sure to review the specific job description before every technical round.`;
  }

  return `### CareerPath Advisor Guidance

Hello **${studentProfile.full_name || 'Student'}**, I am analyzing your profile for **${targetRole}**:

- **Current Verified Skills (${skills.length})**: ${skills.join(', ') || 'None added yet'}
- **Profile Completeness**: **${studentProfile.completeness_score || 0}%**
- **Active Applications**: **${applications.length} applications** tracked in your pipeline.

**Next Actionable Steps**:
1. Check your **Skills & Gap Analysis** tab to see missing competencies for ${targetRole}.
2. Watch the curated masterclasses to acquire high-demand tools like Docker, Redis, and TypeScript.
3. Keep your project repositories and live demo links updated.`;
}

class CareerAssistantService {
  /**
   * Main chat function proxying OpenRouter free-tier models with ordered fallback.
   */
  async chat({ userId, messages = [] }) {
    // 1. Resolve student profile
    const student = await studentRepo.findByUserId(userId);
    if (!student) {
      throw new Error('Student profile not found');
    }

    const fullProfile = await studentRepo.getFullProfile(student.id);
    const applications = await appRepo.findByStudent(student.id);

    // 2. Build grounded system prompt
    const systemPrompt = buildGroundedSystemPrompt(fullProfile, applications);

    const apiKey = getOpenRouterApiKey();
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';

    // If no API key configured, use local grounded engine
    if (!apiKey) {
      console.warn('[CareerAssistant] OPENROUTER_API_KEY not configured. Using local grounded advisor.');
      return {
        reply: generateLocalGroundedAdvice(lastUserMessage, fullProfile, applications),
        modelUsed: 'careerpath-grounded-engine (local)',
        isFallback: true,
        groundedContext: {
          studentName: fullProfile.full_name,
          skillsCount: (fullProfile.skills || []).length,
          applicationsCount: applications.length,
          completeness: fullProfile.completeness_score
        }
      };
    }

    // Prepare conversation payload for OpenRouter
    const chatPayload = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-8) // keep recent 8 turns for context window efficiency
    ];

    let lastError = null;

    // 3. Try each model in the verified fallback chain
    for (const model of FREE_MODELS_FALLBACK_CHAIN) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

        const response = await fetch(OPENROUTER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': process.env.APP_BASE_URL || 'http://localhost:3000',
            'X-Title': 'CareerPath Student Platform'
          },
          body: JSON.stringify({
            model,
            messages: chatPayload,
            temperature: 0.2, // low temperature for strict factual grounding
            max_tokens: 800
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const data = await response.json().catch(() => ({}));

        if (response.ok && data?.choices?.[0]?.message?.content) {
          return {
            reply: data.choices[0].message.content,
            modelUsed: model,
            isFallback: false,
            groundedContext: {
              studentName: fullProfile.full_name,
              skillsCount: (fullProfile.skills || []).length,
              applicationsCount: applications.length,
              completeness: fullProfile.completeness_score
            }
          };
        }

        const errMsg = data?.error?.message || `HTTP ${response.status}`;
        console.warn(`[CareerAssistant] Model ${model} failed (${errMsg}). Trying next model in fallback chain...`);
        lastError = new Error(errMsg);
      } catch (err) {
        console.warn(`[CareerAssistant] Model ${model} request error (${err.message}). Trying next...`);
        lastError = err;
      }
    }

    // 4. If all upstream OpenRouter models failed (e.g., 429 rate limits or daily quota reached)
    console.warn('[CareerAssistant] All OpenRouter free models congested or quota reached. Engaging local grounded fallback.');
    return {
      reply: generateLocalGroundedAdvice(lastUserMessage, fullProfile, applications),
      modelUsed: 'careerpath-grounded-engine (congestion-fallback)',
      isFallback: true,
      upstreamError: lastError ? lastError.message : 'Upstream congested',
      groundedContext: {
        studentName: fullProfile.full_name,
        skillsCount: (fullProfile.skills || []).length,
        applicationsCount: applications.length,
        completeness: fullProfile.completeness_score
      }
    };
  }
}

module.exports = new CareerAssistantService();
