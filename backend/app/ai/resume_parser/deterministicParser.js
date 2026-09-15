// backend/app/ai/resume_parser/deterministicParser.js
// Deterministic rule-based resume text and section extraction

class DeterministicParser {
  parse(rawText) {
    if (!rawText) return { text: '', email: null, phone: null, skills: [], sections: {} };

    const emailMatch = rawText.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);

    const skillsCatalog = [
      'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'react', 'react.js',
      'node', 'node.js', 'express', 'html', 'css', 'tailwind', 'sql', 'mysql', 'postgresql',
      'sqlite', 'mongodb', 'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'git', 'ci/cd',
      'rest api', 'graphql', 'machine learning', 'nlp', 'pandas', 'numpy', 'scikit-learn'
    ];

    const lowerText = rawText.toLowerCase();
    const detectedSkills = skillsCatalog.filter(skill => {
      const regex = new RegExp(`\\b${skill.replace('.', '\\.')}\\b`, 'i');
      return regex.test(lowerText);
    });

    return {
      textLength: rawText.length,
      email: emailMatch ? emailMatch[0] : null,
      phone: phoneMatch ? phoneMatch[0] : null,
      extractedSkills: detectedSkills,
      hasEducation: /(bachelor|master|b\.tech|degree|university|college|diploma)/i.test(lowerText),
      hasExperience: /(experience|worked|intern|developer|engineer|lead|senior)/i.test(lowerText)
    };
  }
}

module.exports = new DeterministicParser();
