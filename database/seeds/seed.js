'use strict';

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const DATA_DIR = process.env.DB_DIR || path.resolve(__dirname, '../../data');
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'talentai.db');

function seedDatabase() {
  console.log(`🌱 Seeding database at: ${DB_PATH}`);

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, async (err) => {
      if (err) return reject(err);

      const run = (sql, params = []) => new Promise((res, rej) => {
        db.run(sql, params, function (e) {
          if (e) return rej(e);
          res({ lastID: this.lastID, changes: this.changes });
        });
      });

      const get = (sql, params = []) => new Promise((res, rej) => {
        db.get(sql, params, (e, row) => {
          if (e) return rej(e);
          res(row || null);
        });
      });

      try {
        // 1. Categories
        const categories = [
          { name: 'Programming Languages', description: 'Core programming and scripting languages' },
          { name: 'Frontend Development', description: 'User interface and web technologies' },
          { name: 'Backend Development', description: 'Server-side frameworks and APIs' },
          { name: 'Database & Storage', description: 'Relational, NoSQL, and caching systems' },
          { name: 'Cloud & DevOps', description: 'Containerization, cloud providers, and CI/CD' },
          { name: 'Data Science & AI/ML', description: 'Machine learning, neural networks, and data analytics' },
          { name: 'Core Computer Science', description: 'Data structures, algorithms, and system design' }
        ];

        const categoryMap = {};
        for (const cat of categories) {
          await run('INSERT OR IGNORE INTO skill_categories (name, description) VALUES (?, ?)', [cat.name, cat.description]);
          const row = await get('SELECT id FROM skill_categories WHERE name = ?', [cat.name]);
          if (row) categoryMap[cat.name] = row.id;
        }

        // 2. Canonical Skills & Hierarchies
        const skillsData = [
          { name: 'JavaScript', category: 'Programming Languages', parent: null, aliases: ['JS', 'Javascript', 'ECMAScript'] },
          { name: 'TypeScript', category: 'Programming Languages', parent: 'JavaScript', aliases: ['TS'] },
          { name: 'Python', category: 'Programming Languages', parent: null, aliases: ['Python3', 'Py'] },
          { name: 'Java', category: 'Programming Languages', parent: null, aliases: ['Core Java', 'Java 8', 'Java 17'] },
          { name: 'C++', category: 'Programming Languages', parent: null, aliases: ['CPP'] },
          { name: 'Go', category: 'Programming Languages', parent: null, aliases: ['Golang'] },
          { name: 'HTML/CSS', category: 'Frontend Development', parent: null, aliases: ['HTML', 'CSS', 'HTML5', 'CSS3'] },
          { name: 'React', category: 'Frontend Development', parent: 'JavaScript', aliases: ['ReactJS', 'React.js'] },
          { name: 'Next.js', category: 'Frontend Development', parent: 'React', aliases: ['NextJS', 'Next.js 14', 'Next'] },
          { name: 'Tailwind CSS', category: 'Frontend Development', parent: 'HTML/CSS', aliases: ['Tailwind', 'TailwindCSS'] },
          { name: 'Node.js', category: 'Backend Development', parent: 'JavaScript', aliases: ['NodeJS', 'Node'] },
          { name: 'Express', category: 'Backend Development', parent: 'Node.js', aliases: ['ExpressJS', 'Express.js'] },
          { name: 'FastAPI', category: 'Backend Development', parent: 'Python', aliases: ['Fast API'] },
          { name: 'Django', category: 'Backend Development', parent: 'Python', aliases: ['Django REST Framework', 'DRF'] },
          { name: 'Flask', category: 'Backend Development', parent: 'Python', aliases: [] },
          { name: 'Spring Boot', category: 'Backend Development', parent: 'Java', aliases: ['SpringBoot', 'Spring Framework'] },
          { name: 'REST API', category: 'Backend Development', parent: null, aliases: ['RESTful API', 'REST', 'RESTful Services'] },
          { name: 'GraphQL', category: 'Backend Development', parent: null, aliases: ['GraphQL API'] },
          { name: 'SQL', category: 'Database & Storage', parent: null, aliases: ['Relational Database', 'RDBMS'] },
          { name: 'PostgreSQL', category: 'Database & Storage', parent: 'SQL', aliases: ['Postgres', 'PSQL', 'pg'] },
          { name: 'MySQL', category: 'Database & Storage', parent: 'SQL', aliases: ['My SQL'] },
          { name: 'SQLite', category: 'Database & Storage', parent: 'SQL', aliases: ['SQLite3'] },
          { name: 'MongoDB', category: 'Database & Storage', parent: null, aliases: ['Mongo', 'NoSQL'] },
          { name: 'Redis', category: 'Database & Storage', parent: null, aliases: ['Redis Cache'] },
          { name: 'Git', category: 'Cloud & DevOps', parent: null, aliases: ['GitHub', 'GitLab', 'Version Control'] },
          { name: 'Docker', category: 'Cloud & DevOps', parent: null, aliases: ['Containerization', 'Docker Containers'] },
          { name: 'Kubernetes', category: 'Cloud & DevOps', parent: 'Docker', aliases: ['K8s'] },
          { name: 'AWS', category: 'Cloud & DevOps', parent: null, aliases: ['Amazon Web Services', 'Amazon AWS'] },
          { name: 'CI/CD', category: 'Cloud & DevOps', parent: null, aliases: ['Continuous Integration', 'GitHub Actions'] },
          { name: 'Machine Learning', category: 'Data Science & AI/ML', parent: null, aliases: ['ML', 'Applied ML'] },
          { name: 'PyTorch', category: 'Data Science & AI/ML', parent: 'Python', aliases: ['Torch'] },
          { name: 'TensorFlow', category: 'Data Science & AI/ML', parent: 'Python', aliases: ['TF', 'Keras'] },
          { name: 'NumPy', category: 'Data Science & AI/ML', parent: 'Python', aliases: ['Numpy'] },
          { name: 'Pandas', category: 'Data Science & AI/ML', parent: 'Python', aliases: [] }
        ];

        const skillMap = {};
        for (const s of skillsData) {
          const catId = categoryMap[s.category] || null;
          await run('INSERT OR IGNORE INTO skills (category_id, canonical_name, is_active) VALUES (?, ?, 1)', [catId, s.name]);
          const row = await get('SELECT id FROM skills WHERE canonical_name = ?', [s.name]);
          if (row) skillMap[s.name] = row.id;
        }

        for (const s of skillsData) {
          const skillId = skillMap[s.name];
          if (!skillId) continue;
          if (s.parent && skillMap[s.parent]) {
            await run('UPDATE skills SET parent_skill_id = ? WHERE id = ?', [skillMap[s.parent], skillId]);
          }
          if (Array.isArray(s.aliases)) {
            for (const alias of s.aliases) {
              await run('INSERT OR IGNORE INTO skill_aliases (skill_id, alias_name) VALUES (?, ?)', [skillId, alias]);
            }
          }
        }

        // 3. Demo accounts
        const defaultPasswordHash = await bcrypt.hash('Password@123', 10);

        // Admin
        await run(
          `INSERT OR IGNORE INTO users (email, password_hash, role, full_name, phone, status) VALUES (?, ?, 'admin', ?, ?, 'active')`,
          ['admin@talentai.edu', defaultPasswordHash, 'Dr. TPO Administrator', '+91 9876543210']
        );

        // Recruiter
        await run(
          `INSERT OR IGNORE INTO companies (name, website, domain, description, industry, verification_status) VALUES (?, ?, ?, ?, ?, 'verified')`,
          ['TechCorp Innovations', 'https://techcorp.example.com', 'techcorp.com', 'Leading enterprise AI & cloud solutions provider', 'Information Technology']
        );
        const company = await get('SELECT id FROM companies WHERE name = ?', ['TechCorp Innovations']);

        await run(
          `INSERT OR IGNORE INTO users (email, password_hash, role, full_name, phone, status) VALUES (?, ?, 'recruiter', ?, ?, 'active')`,
          ['recruiter@techcorp.com', defaultPasswordHash, 'Sarah Jenkins', '+91 9876543211']
        );
        const recruiterUser = await get('SELECT id FROM users WHERE email = ?', ['recruiter@techcorp.com']);

        if (recruiterUser && company) {
          await run(
            `INSERT OR IGNORE INTO recruiter_profiles (user_id, company_id, designation, department, is_company_admin) VALUES (?, ?, ?, ?, 1)`,
            [recruiterUser.id, company.id, 'Senior Technical Recruiter', 'Talent Acquisition']
          );
        }
        const recruiterProfile = await get('SELECT id FROM recruiter_profiles WHERE user_id = ?', [recruiterUser?.id]);

        // Student
        await run(
          `INSERT OR IGNORE INTO users (email, password_hash, role, full_name, phone, status) VALUES (?, ?, 'student', ?, ?, 'active')`,
          ['student@talentai.edu', defaultPasswordHash, 'Anup Mazumdar', '+91 9876543212']
        );
        const studentUser = await get('SELECT id FROM users WHERE email = ?', ['student@talentai.edu']);

        if (studentUser) {
          await run(
            `INSERT OR IGNORE INTO student_profiles (user_id, headline, bio, location, github_url, linkedin_url, preferred_role, preferred_location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              studentUser.id,
              'MCA Student & Full Stack AI Developer | UEM Jaipur',
              'Passionate about building scalable AI recruitment platforms and cloud native architectures.',
              'Jaipur, India',
              'https://github.com/anupmazumdar',
              'https://linkedin.com/in/anup-mazumdar-1033b5321',
              'Full Stack Software Engineer',
              'Bangalore / Remote'
            ]
          );
          const studentProfile = await get('SELECT id FROM student_profiles WHERE user_id = ?', [studentUser.id]);

          if (studentProfile) {
            await run(
              `INSERT OR IGNORE INTO student_education (student_id, institution, degree, field_of_study, start_year, end_year, grade_or_cgpa) VALUES (?, ?, ?, ?, 2025, 2027, '8.9 CGPA')`,
              [studentProfile.id, 'University of Engineering & Management, Jaipur', 'Master of Computer Applications (MCA)', 'Computer Science & AI']
            );

            const studentSkills = ['Python', 'FastAPI', 'SQL', 'Docker', 'Git', 'React'];
            for (const skillName of studentSkills) {
              if (skillMap[skillName]) {
                await run(
                  `INSERT OR IGNORE INTO student_skills (student_id, skill_id, proficiency_level, source, confidence_score) VALUES (?, ?, 'expert', 'quiz_verified', 0.95)`,
                  [studentProfile.id, skillMap[skillName]]
                );
              }
            }

            await run(
              `INSERT OR IGNORE INTO student_projects (student_id, title, description, technologies, github_url) VALUES (?, ?, ?, ?, ?)`,
              [
                studentProfile.id,
                'Unified AI Career & Recruitment Platform',
                'Consolidated career portal with hybrid matching engine, ATS resume diagnostic, and multi-model interview evaluator.',
                JSON.stringify(['React', 'Node.js', 'Python', 'FastAPI', 'SQL', 'Docker']),
                'https://github.com/anupmazumdar/anupmazumdar-AIRecruitmentAgent'
              ]
            );
          }
        }

        // 4. Jobs
        if (company && recruiterProfile) {
          await run(
            `INSERT OR IGNORE INTO jobs (company_id, created_by_recruiter_id, title, description, department, location, employment_type, experience_level, min_experience_years, min_education, min_salary, max_salary, deadline, status)
             VALUES (?, ?, ?, ?, ?, ?, 'full-time', 'entry', 0, 'Bachelor', 800000, 1400000, datetime('now', '+30 days'), 'published')`,
            [
              company.id,
              recruiterProfile.id,
              'Full Stack Software Engineer (Python & React)',
              'Design scalable RESTful services in Python/FastAPI, construct UIs with React, and manage containerized deployments.',
              'Engineering',
              'Bangalore, India (Hybrid)'
            ]
          );

          const job1 = await get('SELECT id FROM jobs WHERE title LIKE ?', ['%Full Stack Software Engineer%']);
          if (job1) {
            for (const s of ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'Git']) {
              if (skillMap[s]) await run('INSERT OR IGNORE INTO job_skills (job_id, skill_id, is_required, weight) VALUES (?, ?, 1, 1.0)', [job1.id, skillMap[s]]);
            }
            for (const s of ['AWS', 'React']) {
              if (skillMap[s]) await run('INSERT OR IGNORE INTO job_skills (job_id, skill_id, is_required, weight) VALUES (?, ?, 0, 0.5)', [job1.id, skillMap[s]]);
            }
          }
        }

        console.log('✅ Seeding completed successfully.');
        db.close(resolve);
      } catch (err) {
        db.close(() => reject(err));
      }
    });
  });
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
