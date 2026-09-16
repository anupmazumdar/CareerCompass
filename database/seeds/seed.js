'use strict';

const fs = require('fs');
const path = require('path');

let sqlite3;
try {
  sqlite3 = require('sqlite3').verbose();
} catch (err) {
  try {
    sqlite3 = require(path.resolve(__dirname, '../../backend/node_modules/sqlite3')).verbose();
  } catch (backendErr) {
    sqlite3 = require(path.resolve(__dirname, '../node_modules/sqlite3')).verbose();
  }
}

let bcrypt;
try {
  bcrypt = require('bcryptjs');
} catch (err) {
  try {
    bcrypt = require(path.resolve(__dirname, '../../backend/node_modules/bcryptjs'));
  } catch (backendErr) {
    bcrypt = require(path.resolve(__dirname, '../node_modules/bcryptjs'));
  }
}

const DATA_DIR = process.env.DB_DIR || path.resolve(__dirname, '../../data');
const DEFAULT_DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'talentai.db');

function seedDatabase(targetDbPath = DEFAULT_DB_PATH) {
  console.log(`🌱 Seeding database at: ${targetDbPath}`);

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(targetDbPath, async (err) => {
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
          { name: 'Data Science & AI/ML', description: 'Machine learning, neural networks, and data analytics' }
        ];

        for (const cat of categories) {
          await run(
            `INSERT OR IGNORE INTO skill_categories (name, description) VALUES (?, ?)`,
            [cat.name, cat.description]
          );
        }

        const catRows = await new Promise((res, rej) => {
          db.all('SELECT id, name FROM skill_categories', (e, rows) => e ? rej(e) : res(rows));
        });
        const catMap = Object.fromEntries(catRows.map(c => [c.name, c.id]));

        // 2. Canonical Skills
        const skillsData = [
          // Programming Languages
          { name: 'Python', category: 'Programming Languages' },
          { name: 'JavaScript', category: 'Programming Languages' },
          { name: 'TypeScript', category: 'Programming Languages' },
          { name: 'Java', category: 'Programming Languages' },
          { name: 'Go', category: 'Programming Languages' },
          { name: 'C++', category: 'Programming Languages' },
          { name: 'SQL', category: 'Programming Languages' },

          // Frontend
          { name: 'React', category: 'Frontend Development' },
          { name: 'Next.js', category: 'Frontend Development' },
          { name: 'Vue.js', category: 'Frontend Development' },
          { name: 'Tailwind CSS', category: 'Frontend Development' },
          { name: 'HTML5/CSS3', category: 'Frontend Development' },
          { name: 'Redux', category: 'Frontend Development' },
          { name: 'Framer Motion', category: 'Frontend Development' },

          // Backend
          { name: 'Node.js', category: 'Backend Development' },
          { name: 'Express.js', category: 'Backend Development' },
          { name: 'FastAPI', category: 'Backend Development' },
          { name: 'Django', category: 'Backend Development' },
          { name: 'Spring Boot', category: 'Backend Development' },
          { name: 'REST APIs', category: 'Backend Development' },
          { name: 'GraphQL', category: 'Backend Development' },
          { name: 'Microservices', category: 'Backend Development' },

          // Database & Storage
          { name: 'PostgreSQL', category: 'Database & Storage' },
          { name: 'MySQL', category: 'Database & Storage' },
          { name: 'MongoDB', category: 'Database & Storage' },
          { name: 'Redis', category: 'Database & Storage' },
          { name: 'SQLite', category: 'Database & Storage' },

          // Cloud & DevOps
          { name: 'Docker', category: 'Cloud & DevOps' },
          { name: 'Kubernetes', category: 'Cloud & DevOps' },
          { name: 'AWS', category: 'Cloud & DevOps' },
          { name: 'Google Cloud Platform', category: 'Cloud & DevOps' },
          { name: 'CI/CD Pipelines', category: 'Cloud & DevOps' },
          { name: 'Git', category: 'Cloud & DevOps' },
          { name: 'Linux', category: 'Cloud & DevOps' },

          // AI / ML
          { name: 'Machine Learning', category: 'Data Science & AI/ML' },
          { name: 'PyTorch', category: 'Data Science & AI/ML' },
          { name: 'TensorFlow', category: 'Data Science & AI/ML' },
          { name: 'Pandas', category: 'Data Science & AI/ML' },
          { name: 'Large Language Models', category: 'Data Science & AI/ML' },
          { name: 'Data Structures', category: 'Programming Languages' },
          { name: 'System Design', category: 'Backend Development' }
        ];

        for (const s of skillsData) {
          await run(
            `INSERT OR IGNORE INTO skills (canonical_name, category_id) VALUES (?, ?)`,
            [s.name, catMap[s.category] || null]
          );
        }

        const skillRows = await new Promise((res, rej) => {
          db.all('SELECT id, canonical_name as name FROM skills', (e, rows) => e ? rej(e) : res(rows));
        });
        const skillMap = Object.fromEntries(skillRows.map(s => [s.name, s.id]));

        // 3. Companies
        const companiesData = [
          { name: 'Razorpay', website: 'https://razorpay.com', industry: 'Fintech & Payments' },
          { name: 'CRED', website: 'https://cred.club', industry: 'Fintech Rewards' },
          { name: 'Swiggy', website: 'https://swiggy.com', industry: 'FoodTech & Quick Commerce' },
          { name: 'Zomato', website: 'https://zomato.com', industry: 'Food Delivery' },
          { name: 'Microsoft India', website: 'https://microsoft.com', industry: 'Cloud & AI' },
          { name: 'Google India', website: 'https://google.com', industry: 'Search & Cloud' },
          { name: 'Flipkart', website: 'https://flipkart.com', industry: 'E-Commerce' },
          { name: 'Zoho Corporation', website: 'https://zoho.com', industry: 'Enterprise SaaS' },
          { name: 'Freshworks', website: 'https://freshworks.com', industry: 'Customer Software' },
          { name: 'Atlassian', website: 'https://atlassian.com', industry: 'Productivity & DevOps' },
          { name: 'PhonePe', website: 'https://phonepe.com', industry: 'Digital Payments' },
          { name: 'Postman', website: 'https://postman.com', industry: 'API Platform' },
          { name: 'Zerodha', website: 'https://zerodha.com', industry: 'Discount Broking & Fintech' },
          { name: 'Zepto', website: 'https://zeptonow.com', industry: 'Quick Commerce' },
          { name: 'BrowserStack', website: 'https://browserstack.com', industry: 'Cloud Testing' },
          { name: 'Hasura', website: 'https://hasura.io', industry: 'GraphQL & Data APIs' },
          { name: 'Urban Company', website: 'https://urbancompany.com', industry: 'Home Services Marketplace' },
          { name: 'Cisco Systems', website: 'https://cisco.com', industry: 'Networking & Security' },
          { name: 'Oracle India', website: 'https://oracle.com', industry: 'Database & Cloud' },
          { name: 'TCS Digital', website: 'https://tcs.com', industry: 'Digital Consulting' },
          { name: 'Infosys', website: 'https://infosys.com', industry: 'IT & Digital Transformation' },
          { name: 'TechCorp Innovations', website: 'https://techcorp.example.com', industry: 'Enterprise Cloud' }
        ];

        const companyMap = new Map();
        for (const c of companiesData) {
          let row = await get('SELECT id FROM companies WHERE name = ?', [c.name]);
          if (!row) {
            const res = await run(
              `INSERT INTO companies (name, website, industry, verification_status) VALUES (?, ?, ?, 'verified')`,
              [c.name, c.website, c.industry]
            );
            companyMap.set(c.name, res.lastID);
          } else {
            companyMap.set(c.name, row.id);
          }
        }

        // 4. Default Passwords & Standard Users
        const defaultPasswordHash = await bcrypt.hash('CompassPassword@123', 10);

        // Superadmin (Only with explicit env or local dev)
        const superadminEmail = process.env.SUPERADMIN_EMAIL;
        const superadminPassword = process.env.SUPERADMIN_PASSWORD;
        if (superadminEmail && superadminPassword) {
          const superadminHash = await bcrypt.hash(superadminPassword, 10);
          await run(
            `INSERT OR IGNORE INTO users (email, password_hash, role, full_name, phone, status) VALUES (?, ?, 'admin', ?, ?, 'active')`,
            [superadminEmail, superadminHash, process.env.SUPERADMIN_NAME || 'CareerCompass Admin', '+91 9876543210']
          );
        }

        // Recruiter User
        await run(
          `INSERT OR IGNORE INTO users (email, password_hash, role, full_name, phone, status) VALUES (?, ?, 'recruiter', ?, ?, 'active')`,
          ['recruiter@careercompass.io', defaultPasswordHash, 'Sarah Jenkins', '+91 9876543211']
        );
        const recruiterUser = await get('SELECT id FROM users WHERE email = ?', ['recruiter@careercompass.io']);
        if (recruiterUser) {
          await run(
            `INSERT OR IGNORE INTO recruiter_profiles (user_id, company_id, designation, department, is_company_admin) VALUES (?, ?, ?, ?, 1)`,
            [recruiterUser.id, companyMap.get('Razorpay') || 1, 'Senior Technical Recruiter', 'Talent Acquisition']
          );
        }
        const recruiterProfile = await get('SELECT id FROM recruiter_profiles WHERE user_id = ?', [recruiterUser?.id]);

        // Demo Student: Alex Chen
        await run(
          `INSERT OR IGNORE INTO users (email, password_hash, role, full_name, phone, status) VALUES (?, ?, 'student', ?, ?, 'active')`,
          ['student@careercompass.io', defaultPasswordHash, 'Alex Chen', '+91 9876543212']
        );
        const studentUser = await get('SELECT id FROM users WHERE email = ?', ['student@careercompass.io']);

        if (studentUser) {
          await run(
            `INSERT OR IGNORE INTO student_profiles (
              user_id, headline, bio, location, college, degree, branch, current_semester,
              graduation_year, cgpa, preferred_role, preferred_roles, preferred_locations,
              work_mode_preference, github_url, linkedin_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              studentUser.id,
              'MCA Student & Full Stack Software Engineer | Campus Placement Aspirant',
              'Passionate full-stack developer with strong foundations in React, Node.js, and distributed backend systems. Actively benchmarked for campus placements.',
              'Bangalore, India',
              'National Institute of Technology, Karnataka',
              'Master of Computer Applications (MCA)',
              'Computer Science',
              5,
              2026,
              8.85,
              'Full Stack Software Engineer',
              JSON.stringify(['Full Stack Software Engineer', 'Backend Engineer', 'Frontend Developer']),
              JSON.stringify(['Bangalore', 'Remote', 'Hyderabad']),
              'hybrid',
              'https://github.com/alexchen-dev',
              'https://linkedin.com/in/alexchen-career'
            ]
          );

          const studentProfile = await get('SELECT id FROM student_profiles WHERE user_id = ?', [studentUser.id]);
          if (studentProfile) {
            // Student Education
            await run(
              `INSERT OR IGNORE INTO student_education (student_id, institution, degree, field_of_study, start_year, end_year, grade_or_cgpa)
               VALUES (?, ?, ?, ?, 2024, 2026, '8.85 CGPA')`,
              [studentProfile.id, 'National Institute of Technology, Karnataka', 'MCA', 'Computer Science & Engineering']
            );

            // Student Skills
            const studentSkillsList = ['React', 'Node.js', 'JavaScript', 'TypeScript', 'SQL', 'PostgreSQL', 'Docker', 'Git'];
            for (const skName of studentSkillsList) {
              if (skillMap[skName]) {
                await run(
                  `INSERT OR IGNORE INTO student_skills (student_id, skill_id, proficiency_level, source, confidence_score)
                   VALUES (?, ?, 'expert', 'quiz_verified', 0.90)`,
                  [studentProfile.id, skillMap[skName]]
                );
              }
            }

            // Student Projects
            await run(
              `INSERT OR IGNORE INTO student_projects (student_id, title, description, technologies, github_url, project_url)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                studentProfile.id,
                'Cloud-Native Campus Placement Platform',
                'Architected full-stack recruitment portal featuring automated skill gap analysis, ATS parsing, and applicant Kanban tracking.',
                JSON.stringify(['React', 'Node.js', 'PostgreSQL', 'Docker', 'Tailwind CSS']),
                'https://github.com/alexchen-dev/placement-portal',
                'https://portal-demo.careercompass.io'
              ]
            );

            // Student Resumes
            await run(
              `INSERT OR IGNORE INTO resumes (student_id, file_name, file_path, mime_type, file_size, version_label, is_primary)
               VALUES (?, ?, ?, ?, ?, ?, 1)`,
              [studentProfile.id, 'Alex_Chen_FullStack_Resume.pdf', '/uploads/resumes/alex_chen_fullstack.pdf', 'application/pdf', 142800, 'Full Stack Core']
            );

            // Student Goals
            await run(
              `INSERT OR IGNORE INTO student_goals (student_id, title, description, category, target_date, status)
               VALUES (?, ?, ?, 'skill', datetime('now', '+30 days'), 'in_progress')`,
              [studentProfile.id, 'Master Redis Caching & Distributed Locks', 'Complete benchmark modules and implement rate limiter with Redis in Node.js backend.']
            );
          }
        }

        // 5. Seed 42+ Realistic Opportunities Across Diverse Types, Locations, Work Modes, and Deadlines
        const addDays = (d) => {
          const date = new Date(Date.now() + d * 86400000);
          return date.toISOString().split('T')[0] + 'T23:59:59Z';
        };

        const opportunitiesList = [
          // Internships (12)
          {
            company: 'Razorpay',
            title: 'Backend Engineering Intern',
            type: 'Internship',
            work_mode: 'hybrid',
            location: 'Bangalore, India',
            min_cgpa: 7.5,
            eligible_branches: ['CSE', 'IT', 'MCA'],
            eligible_grad_years: ['2025', '2026'],
            stipend_range: '₹50,000 - ₹65,000 / month',
            deadline: addDays(4), // Closing soon
            required_skills: ['Node.js', 'PostgreSQL', 'Redis', 'Docker'],
            description: 'Build robust payment settlement pipelines handling billions in GMV. Work with distributed transaction management and low-latency caching.',
            apply_link: 'https://razorpay.com/careers'
          },
          {
            company: 'CRED',
            title: 'Frontend Product Engineering Intern',
            type: 'Internship',
            work_mode: 'onsite',
            location: 'Bangalore, India',
            min_cgpa: 8.0,
            eligible_branches: ['CSE', 'IT', 'MCA'],
            eligible_grad_years: ['2025', '2026'],
            stipend_range: '₹75,000 - ₹90,000 / month',
            deadline: addDays(5), // Closing soon
            required_skills: ['React', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
            description: 'Design world-class web experiences with fluid animations, micro-interactions, and sub-second rendering for high-net-worth members.',
            apply_link: 'https://cred.club/careers'
          },
          {
            company: 'Swiggy',
            title: 'Full Stack Engineering Intern',
            type: 'Internship',
            work_mode: 'hybrid',
            location: 'Bangalore, India',
            min_cgpa: 7.0,
            eligible_branches: ['All'],
            eligible_grad_years: ['2025', '2026'],
            stipend_range: '₹45,000 - ₹60,000 / month',
            deadline: addDays(7), // Closing soon
            required_skills: ['React', 'Node.js', 'MongoDB', 'JavaScript'],
            description: 'Join the consumer app team to engineer high-scale ordering workflows, live maps, and merchant partner portals.',
            apply_link: 'https://swiggy.com/careers'
          },
          {
            company: 'Postman',
            title: 'API Infrastructure Intern',
            type: 'Internship',
            work_mode: 'remote',
            location: 'Remote, India',
            min_cgpa: 7.5,
            eligible_branches: ['CSE', 'IT', 'MCA'],
            eligible_grad_years: ['2025', '2026'],
            stipend_range: '₹60,000 - ₹75,000 / month',
            deadline: addDays(12),
            required_skills: ['Node.js', 'REST APIs', 'GraphQL', 'Docker'],
            description: 'Contribute to developer tools used by 30+ million engineers globally. Work on cloud API testing agents and observability pipelines.',
            apply_link: 'https://postman.com/careers'
          },
          {
            company: 'Zerodha',
            title: 'Systems & Backend Engineering Intern',
            type: 'Internship',
            work_mode: 'onsite',
            location: 'Bangalore, India',
            min_cgpa: 7.5,
            eligible_branches: ['CSE', 'IT', 'MCA'],
            eligible_grad_years: ['2025', '2026'],
            stipend_range: '₹60,000 - ₹80,000 / month',
            deadline: addDays(14),
            required_skills: ['Python', 'PostgreSQL', 'Redis', 'Linux'],
            description: 'Build ultra-fast trading and market data feeds. Focus on simple, performant architectures without unnecessary abstraction layers.',
            apply_link: 'https://zerodha.com/careers'
          },
          {
            company: 'Zepto',
            title: 'Data & Growth Analytics Intern',
            type: 'Internship',
            work_mode: 'hybrid',
            location: 'Mumbai, India',
            min_cgpa: 7.0,
            eligible_branches: ['All'],
            eligible_grad_years: ['2025', '2026'],
            stipend_range: '₹40,000 - ₹55,000 / month',
            deadline: addDays(15),
            required_skills: ['Python', 'SQL', 'Pandas', 'FastAPI'],
            description: 'Analyze ultra-fast order fulfillment telemetry, rider dispatch algorithms, and dark-store inventory turnover.',
            apply_link: 'https://zeptonow.com/careers'
          },
          {
            company: 'BrowserStack',
            title: 'Cloud Infrastructure Intern',
            type: 'Internship',
            work_mode: 'remote',
            location: 'Remote, India',
            min_cgpa: 7.0,
            eligible_branches: ['CSE', 'IT', 'MCA'],
            eligible_grad_years: ['2025', '2026'],
            stipend_range: '₹55,000 - ₹70,000 / month',
            deadline: addDays(18),
            required_skills: ['Docker', 'Kubernetes', 'Linux', 'AWS'],
            description: 'Automate containerized browser nodes and real-device testing clusters spanning multiple worldwide regions.',
            apply_link: 'https://browserstack.com/careers'
          },
          {
            company: 'Hasura',
            title: 'GraphQL Engine Intern',
            type: 'Internship',
            work_mode: 'remote',
            location: 'Remote, India',
            min_cgpa: 7.5,
            eligible_branches: ['CSE', 'IT', 'MCA'],
            eligible_grad_years: ['2025', '2026'],
            stipend_range: '₹50,000 - ₹70,000 / month',
            deadline: addDays(20),
            required_skills: ['GraphQL', 'PostgreSQL', 'Docker', 'TypeScript'],
            description: 'Contribute to automated GraphQL and REST API generation over Postgres, metadata authorization, and serverless actions.',
            apply_link: 'https://hasura.io/careers'
          },
          {
            company: 'Urban Company',
            title: 'Mobile & Web Frontend Intern',
            type: 'Internship',
            work_mode: 'hybrid',
            location: 'Gurgaon, India',
            min_cgpa: 7.0,
            eligible_branches: ['All'],
            eligible_grad_years: ['2025', '2026'],
            stipend_range: '₹45,000 - ₹60,000 / month',
            deadline: addDays(22),
            required_skills: ['React', 'JavaScript', 'Tailwind CSS'],
            description: 'Build partner-facing booking flows, scheduling calendars, and customer service self-resolution UIs.',
            apply_link: 'https://urbancompany.com/careers'
          },
          {
            company: 'Zoho Corporation',
            title: 'Cloud Software Engineering Intern',
            type: 'Internship',
            work_mode: 'onsite',
            location: 'Chennai, India',
            min_cgpa: 7.0,
            eligible_branches: ['CSE', 'IT', 'MCA'],
            eligible_grad_years: ['2025', '2026'],
            stipend_range: '₹35,000 - ₹50,000 / month',
            deadline: addDays(25),
            required_skills: ['Java', 'SQL', 'JavaScript', 'HTML5/CSS3'],
            description: 'Write high-availability business software for Zoho CRM, Books, and Mail suites running in independent Zoho private data centers.',
            apply_link: 'https://zoho.com/careers'
          },
          {
            company: 'Freshworks',
            title: 'Product Engineering Intern',
            type: 'Internship',
            work_mode: 'hybrid',
            location: 'Chennai, India',
            min_cgpa: 7.2,
            eligible_branches: ['CSE', 'IT', 'MCA'],
            eligible_grad_years: ['2025', '2026'],
            stipend_range: '₹40,000 - ₹55,000 / month',
            deadline: addDays(28),
            required_skills: ['Node.js', 'React', 'MySQL', 'AWS'],
            description: 'Build enterprise support ticketing tools, omnichannel live chat bots, and customer telemetry dashboards.',
            apply_link: 'https://freshworks.com/careers'
          },
          {
            company: 'Atlassian',
            title: 'Software Development Intern (Jira Cloud)',
            type: 'Internship',
            work_mode: 'remote',
            location: 'Remote, India',
            min_cgpa: 8.0,
            eligible_branches: ['CSE', 'IT', 'MCA'],
            eligible_grad_years: ['2025', '2026'],
            stipend_range: '₹80,000 - ₹1,00,000 / month',
            deadline: addDays(30),
            required_skills: ['Java', 'React', 'TypeScript', 'AWS'],
            description: 'Collaborate with globally distributed squads to ship features in Jira Cloud, Confluence, and Loom with high test coverage.',
            apply_link: 'https://atlassian.com/careers'
          },

          // Full-time Jobs (22)
          {
            company: 'Microsoft India',
            title: 'Software Engineer - Azure Cloud Core',
            type: 'Job',
            work_mode: 'hybrid',
            location: 'Hyderabad, India',
            min_cgpa: 8.0,
            eligible_branches: ['CSE', 'IT', 'MCA'],
            eligible_grad_years: ['2024', '2025'],
            min_salary: 1600000,
            max_salary: 2400000,
            deadline: addDays(6), // Closing soon
            required_skills: ['C++', 'Python', 'Distributed Systems', 'Linux', 'Docker'],
            description: 'Design foundational infrastructure powering Azure computing fabrics. Work on hypervisor drivers, networking overlays, and distributed telemetry.',
            apply_link: 'https://microsoft.com/careers'
          },
          {
            company: 'Google India',
            title: 'Associate Software Engineer - Search & Knowledge Graph',
            type: 'Job',
            work_mode: 'onsite',
            location: 'Bangalore, India',
            min_cgpa: 8.5,
            eligible_branches: ['CSE', 'IT', 'MCA'],
            eligible_grad_years: ['2024', '2025'],
            min_salary: 1800000,
            max_salary: 2800000,
            deadline: addDays(8), // Closing soon
            required_skills: ['Java', 'Python', 'Data Structures', 'Machine Learning', 'Linux'],
            description: 'Engineer high-throughput ranking pipelines and semantic knowledge graphs serving billions of search queries every hour.',
            apply_link: 'https://google.com/careers'
          },
          {
            company: 'Flipkart',
            title: 'Software Development Engineer I (SDE-1)',
            type: 'Job',
            work_mode: 'hybrid',
            location: 'Bangalore, India',
            min_cgpa: 7.5,
            eligible_branches: ['All'],
            eligible_grad_years: ['2024', '2025'],
            min_salary: 1400000,
            max_salary: 2000000,
            deadline: addDays(11),
            required_skills: ['Java', 'Spring Boot', 'MySQL', 'Kafka', 'Docker'],
            description: 'Own order management, logistics delivery estimation, and flash-sale checkout bottlenecks for the Big Billion Days shopping festivals.',
            apply_link: 'https://flipkart.com/careers'
          },
          {
            company: 'PhonePe',
            title: 'Backend Software Engineer - UPI Core',
            type: 'Job',
            work_mode: 'onsite',
            location: 'Bangalore, India',
            min_cgpa: 7.8,
            eligible_branches: ['CSE', 'IT', 'MCA'],
            eligible_grad_years: ['2024', '2025'],
            min_salary: 1500000,
            max_salary: 2200000,
            deadline: addDays(13),
            required_skills: ['Java', 'Spring Boot', 'PostgreSQL', 'Redis', 'Microservices'],
            description: 'Architect low-latency financial switches processing 15,000+ UPI payments per second with 99.999% uptime guarantees.',
            apply_link: 'https://phonepe.com/careers'
          },
          {
            company: 'Zomato',
            title: 'Full Stack Engineer - Dining & Live Events',
            type: 'Job',
            work_mode: 'hybrid',
            location: 'Gurgaon, India',
            min_cgpa: 7.2,
            eligible_branches: ['All'],
            eligible_grad_years: ['2024', '2025'],
            min_salary: 1200000,
            max_salary: 1800000,
            deadline: addDays(16),
            required_skills: ['React', 'Node.js', 'PostgreSQL', 'TypeScript'],
            description: 'Build restaurant reservation systems, ticketing platforms for live festivals, and personalized food discovery feeds.',
            apply_link: 'https://zomato.com/careers'
          },
          {
            company: 'Cisco Systems',
            title: 'Network & Security Software Engineer',
            type: 'Job',
            work_mode: 'hybrid',
            location: 'Bangalore, India',
            min_cgpa: 7.5,
            eligible_branches: ['CSE', 'IT', 'MCA', 'Electronics'],
            eligible_grad_years: ['2024', '2025'],
            min_salary: 1300000,
            max_salary: 1900000,
            deadline: addDays(19),
            required_skills: ['Python', 'C++', 'Linux', 'Docker', 'REST APIs'],
            description: 'Develop enterprise firewall controllers, zero-trust cloud network tunnels, and threat intelligence telemetry systems.',
            apply_link: 'https://cisco.com/careers'
          },
          {
            company: 'Oracle India',
            title: 'Database Cloud Platform Engineer',
            type: 'Job',
            work_mode: 'hybrid',
            location: 'Bangalore, India',
            min_cgpa: 7.5,
            eligible_branches: ['CSE', 'IT', 'MCA'],
            eligible_grad_years: ['2024', '2025'],
            min_salary: 1400000,
            max_salary: 2100000,
            deadline: addDays(21),
            required_skills: ['SQL', 'Java', 'Linux', 'Docker', 'Python'],
            description: 'Work on Oracle Autonomous Database provisioning, automated query optimization algorithms, and multi-tenant cloud storage engines.',
            apply_link: 'https://oracle.com/careers'
          },
          {
            company: 'Razorpay',
            title: 'Full Stack Engineer - Merchant Onboarding',
            type: 'Job',
            work_mode: 'hybrid',
            location: 'Bangalore, India',
            min_cgpa: 7.5,
            eligible_branches: ['CSE', 'IT', 'MCA'],
            eligible_grad_years: ['2024', '2025'],
            min_salary: 1300000,
            max_salary: 1900000,
            deadline: addDays(24),
            required_skills: ['React', 'Node.js', 'PostgreSQL', 'TypeScript', 'Docker'],
            description: 'Streamline KYC verification, automated compliance checks, and dashboard analytics for over 5 million Indian merchants.',
            apply_link: 'https://razorpay.com/careers'
          },
          {
            company: 'CRED',
            title: 'Backend Platform Engineer',
            type: 'Job',
            work_mode: 'onsite',
            location: 'Bangalore, India',
            min_cgpa: 8.0,
            eligible_branches: ['CSE', 'IT', 'MCA'],
            eligible_grad_years: ['2024', '2025'],
            min_salary: 1800000,
            max_salary: 2600000,
            deadline: addDays(27),
            required_skills: ['Go', 'PostgreSQL', 'Redis', 'Docker', 'Microservices'],
            description: 'Design high-concurrency payment disbursement pipelines and microservice architectures with Go and Kafka.',
            apply_link: 'https://cred.club/careers'
          },
          {
            company: 'Zoho Corporation',
            title: 'Member Technical Staff - Cloud Security',
            type: 'Job',
            work_mode: 'onsite',
            location: 'Chennai, India',
            min_cgpa: 7.0,
            eligible_branches: ['All'],
            eligible_grad_years: ['2024', '2025'],
            min_salary: 750000,
            max_salary: 1200000,
            deadline: addDays(29),
            required_skills: ['Java', 'Python', 'Linux', 'SQL'],
            description: 'Build enterprise intrusion detection, log analytics, and authentication frameworks safeguarding data for 100M+ global users.',
            apply_link: 'https://zoho.com/careers'
          },
          {
            company: 'Freshworks',
            title: 'Software Development Engineer - AI Services',
            type: 'Job',
            work_mode: 'hybrid',
            location: 'Chennai, India',
            min_cgpa: 7.5,
            eligible_branches: ['CSE', 'IT', 'MCA'],
            eligible_grad_years: ['2024', '2025'],
            min_salary: 1200000,
            max_salary: 1800000,
            deadline: addDays(31),
            required_skills: ['Python', 'FastAPI', 'Large Language Models', 'Docker', 'AWS'],
            description: 'Build Freddy AI copilot capabilities, automated ticket summarization, and retrieval-augmented customer assistant agents.',
            apply_link: 'https://freshworks.com/careers'
          },
          {
            company: 'TCS Digital',
            title: 'Digital Systems Engineer',
            type: 'Job',
            work_mode: 'hybrid',
            location: 'Pune, India',
            min_cgpa: 7.0,
            eligible_branches: ['All'],
            eligible_grad_years: ['2024', '2025'],
            min_salary: 700000,
            max_salary: 1000000,
            deadline: addDays(33),
            required_skills: ['Java', 'SQL', 'React', 'Git', 'Cloud'],
            description: 'Deliver modern cloud engineering, microservices integration, and automated CI/CD pipelines for Fortune 500 global enterprises.',
            apply_link: 'https://tcs.com/careers'
          },
          {
            company: 'Infosys',
            title: 'Specialist Programmer - Open Source Stack',
            type: 'Job',
            work_mode: 'hybrid',
            location: 'Bangalore, India',
            min_cgpa: 7.2,
            eligible_branches: ['All'],
            eligible_grad_years: ['2024', '2025'],
            min_salary: 950000,
            max_salary: 1350000,
            deadline: addDays(35),
            required_skills: ['Python', 'Java', 'Data Structures', 'SQL', 'Docker'],
            description: 'Solve complex algorithmic, distributed architecture, and cloud deployment challenges as part of the elite Specialist Programmer cadre.',
            apply_link: 'https://infosys.com/careers'
          },
          {
            company: 'Postman',
            title: 'Frontend Engineer - Web Client',
            type: 'Job',
            work_mode: 'remote',
            location: 'Remote, India',
            min_cgpa: 7.5,
            eligible_branches: ['CSE', 'IT', 'MCA'],
            eligible_grad_years: ['2024', '2025'],
            min_salary: 1400000,
            max_salary: 2000000,
            deadline: addDays(36),
            required_skills: ['React', 'TypeScript', 'Redux', 'WebSockets'],
            description: 'Build browser-based API client execution runtimes, real-time collaboration canvas, and documentation generators.',
            apply_link: 'https://postman.com/careers'
          },
          {
            company: 'Zerodha',
            title: 'Frontend Engineer - Kite Web',
            type: 'Job',
            work_mode: 'onsite',
            location: 'Bangalore, India',
            min_cgpa: 7.5,
            eligible_branches: ['All'],
            eligible_grad_years: ['2024', '2025'],
            min_salary: 1400000,
            max_salary: 2200000,
            deadline: addDays(38),
            required_skills: ['Vue.js', 'JavaScript', 'HTML5/CSS3', 'WebSockets'],
            description: 'Engineer ultra-lightweight, zero-bloat financial charts and live trading interfaces executing millions of orders daily.',
            apply_link: 'https://zerodha.com/careers'
          },
          {
            company: 'Zepto',
            title: 'Backend Engineer - Delivery Logistics',
            type: 'Job',
            work_mode: 'onsite',
            location: 'Mumbai, India',
            min_cgpa: 7.2,
            eligible_branches: ['CSE', 'IT', 'MCA'],
            eligible_grad_years: ['2024', '2025'],
            min_salary: 1300000,
            max_salary: 1900000,
            deadline: addDays(40),
            required_skills: ['Go', 'PostgreSQL', 'Redis', 'Docker'],
            description: 'Build high-speed geofencing dispatch systems and dark-store picking optimization engines delivering groceries under 10 minutes.',
            apply_link: 'https://zeptonow.com/careers'
          },
          {
            company: 'BrowserStack',
            title: 'Full Stack Engineer - Automation Grid',
            type: 'Job',
            work_mode: 'remote',
            location: 'Remote, India',
            min_cgpa: 7.2,
            eligible_branches: ['CSE', 'IT', 'MCA'],
            eligible_grad_years: ['2024', '2025'],
            min_salary: 1350000,
            max_salary: 2000000,
            deadline: addDays(42),
            required_skills: ['Node.js', 'React', 'Docker', 'Linux', 'AWS'],
            description: 'Develop developer dashboard controls, real-time video stream proxies, and test failure root-cause analysis tooling.',
            apply_link: 'https://browserstack.com/careers'
          },
          {
            company: 'Hasura',
            title: 'Cloud DevOps & SRE Engineer',
            type: 'Job',
            work_mode: 'remote',
            location: 'Remote, India',
            min_cgpa: 7.5,
            eligible_branches: ['CSE', 'IT', 'MCA'],
            eligible_grad_years: ['2024', '2025'],
            min_salary: 1500000,
            max_salary: 2200000,
            deadline: addDays(43),
            required_skills: ['Kubernetes', 'Terraform', 'Docker', 'AWS', 'Linux'],
            description: 'Automate multi-cloud Kubernetes clusters running Hasura Cloud across AWS, GCP, and Azure with 99.99% availability.',
            apply_link: 'https://hasura.io/careers'
          },
          {
            company: 'Urban Company',
            title: 'Backend Software Engineer - Service Marketplace',
            type: 'Job',
            work_mode: 'hybrid',
            location: 'Gurgaon, India',
            min_cgpa: 7.0,
            eligible_branches: ['All'],
            eligible_grad_years: ['2024', '2025'],
            min_salary: 1200000,
            max_salary: 1800000,
            deadline: addDays(44),
            required_skills: ['Node.js', 'MongoDB', 'Redis', 'Docker'],
            description: 'Architect partner onboarding, skill assessment matrices, dynamic pricing, and automated payout engines.',
            apply_link: 'https://urbancompany.com/careers'
          },
          {
            company: 'Microsoft India',
            title: 'Security Software Engineer - Microsoft Defender',
            type: 'Job',
            work_mode: 'hybrid',
            location: 'Hyderabad, India',
            min_cgpa: 7.8,
            eligible_branches: ['CSE', 'IT', 'MCA'],
            eligible_grad_years: ['2024', '2025'],
            min_salary: 1500000,
            max_salary: 2200000,
            deadline: addDays(45),
            required_skills: ['C++', 'Python', 'Linux', 'Security'],
            description: 'Build endpoint detection sensors, kernel-level behavioral monitors, and automated malware detonation pipelines.',
            apply_link: 'https://microsoft.com/careers'
          },
          {
            company: 'Google India',
            title: 'Cloud Solutions Engineer - Enterprise AI',
            type: 'Job',
            work_mode: 'onsite',
            location: 'Bangalore, India',
            min_cgpa: 8.0,
            eligible_branches: ['CSE', 'IT', 'MCA'],
            eligible_grad_years: ['2024', '2025'],
            min_salary: 1700000,
            max_salary: 2500000,
            deadline: addDays(46),
            required_skills: ['Python', 'Google Cloud Platform', 'Machine Learning', 'Docker'],
            description: 'Help large global enterprises adopt Google Cloud Vertex AI, Gemini foundational models, and vector database architectures.',
            apply_link: 'https://google.com/careers'
          },
          {
            company: 'TechCorp Innovations',
            title: 'Full Stack Software Engineer - AI Recruitment Platform',
            type: 'Job',
            work_mode: 'hybrid',
            location: 'Bangalore, India',
            min_cgpa: 7.0,
            eligible_branches: ['All'],
            eligible_grad_years: ['2024', '2025', '2026'],
            min_salary: 1000000,
            max_salary: 1600000,
            deadline: addDays(48),
            required_skills: ['React', 'Node.js', 'PostgreSQL', 'Docker', 'FastAPI'],
            description: 'Design student career navigation, ATS matching algorithms, and automated skill gap benchmarking tools.',
            apply_link: 'https://techcorp.example.com/careers'
          },

          // Hackathons & Competitions (3)
          {
            company: 'Google India',
            title: 'Google Solutions Challenge 2026',
            type: 'Hackathon',
            work_mode: 'remote',
            location: 'Online / Global',
            min_cgpa: 6.0,
            eligible_branches: ['All'],
            eligible_grad_years: ['All'],
            stipend_range: '₹5,00,000 Total Prize Pool',
            deadline: addDays(10), // Closing soon
            required_skills: ['Python', 'React', 'Google Cloud Platform', 'Machine Learning'],
            description: 'Build innovative tech solutions tackling UN Sustainable Development Goals using Google Cloud, Flutter, and Gemini AI.',
            apply_link: 'https://developers.google.com/community/solutions-challenge'
          },
          {
            company: 'Flipkart',
            title: 'Flipkart GRiD 7.0 - National Tech Campus Challenge',
            type: 'Hackathon',
            work_mode: 'remote',
            location: 'Online / India',
            min_cgpa: 6.5,
            eligible_branches: ['CSE', 'IT', 'MCA', 'ECE'],
            eligible_grad_years: ['2025', '2026'],
            stipend_range: '₹3,00,000 Cash + Direct SDE-1 Interview PPIs',
            deadline: addDays(15),
            required_skills: ['Data Structures', 'Java', 'Python', 'Machine Learning'],
            description: 'India’s flagship campus engineering competition featuring problem statements in Robotics, GenAI e-commerce, and Supply Chain Optimization.',
            apply_link: 'https://unstop.com/competitions/flipkart-grid'
          },
          {
            company: 'Atlassian',
            title: 'Atlassian Global Dev Hackathon - Next-Gen Collaboration',
            type: 'Hackathon',
            work_mode: 'remote',
            location: 'Online / Global',
            min_cgpa: 6.0,
            eligible_branches: ['All'],
            eligible_grad_years: ['All'],
            stipend_range: '₹4,00,000 Cash + Jira Cloud Integration Grants',
            deadline: addDays(25),
            required_skills: ['TypeScript', 'React', 'REST APIs', 'Node.js'],
            description: 'Build Forge apps and integrations that improve remote teamwork, async engineering standups, and developer productivity.',
            apply_link: 'https://atlassian.com/hackathon'
          },

          // Scholarships (3)
          {
            company: 'Microsoft India',
            title: 'Microsoft Diversity in Tech Campus Fellowship',
            type: 'Scholarship',
            work_mode: 'remote',
            location: 'India',
            min_cgpa: 7.5,
            eligible_branches: ['All'],
            eligible_grad_years: ['2025', '2026', '2027'],
            stipend_range: '₹1,50,000 Academic Grant + Executive Mentorship',
            deadline: addDays(9), // Closing soon
            required_skills: ['Computer Science Fundamentals', 'Problem Solving'],
            description: 'Empowering underrepresented student talent in computing with financial sponsorship, cloud credits, and direct access to senior Microsoft engineers.',
            apply_link: 'https://microsoft.com/scholarships'
          },
          {
            company: 'Google India',
            title: 'Generation Google Academic Tech Scholarship',
            type: 'Scholarship',
            work_mode: 'remote',
            location: 'India / APAC',
            min_cgpa: 7.5,
            eligible_branches: ['CSE', 'IT', 'MCA'],
            eligible_grad_years: ['2025', '2026'],
            stipend_range: '$2,500 USD Tuition Award',
            deadline: addDays(17),
            required_skills: ['Computer Science', 'Leadership', 'Diversity in Tech'],
            description: 'Recognizing students who demonstrate academic excellence, leadership impact, and commitment to expanding diversity in computer science.',
            apply_link: 'https://buildyourfuture.withgoogle.com/scholarships'
          },
          {
            company: 'Tata Consultancy Services',
            title: 'TCS Foundation Future Ready STEM Fellowship',
            type: 'Scholarship',
            work_mode: 'remote',
            location: 'India',
            min_cgpa: 7.0,
            eligible_branches: ['CSE', 'IT', 'MCA'],
            eligible_grad_years: ['2025', '2026'],
            stipend_range: '₹1,00,000 Tuition Sponsorship',
            deadline: addDays(30),
            required_skills: ['Mathematics', 'Computer Science'],
            description: 'Scholarship program for deserving MCA and engineering undergraduates pursuing degrees in computer science and cloud technologies.',
            apply_link: 'https://tcs.com/foundation'
          },

          // Certified Courses (2)
          {
            company: 'Google India',
            title: 'Google Cloud Professional Cloud Architect Certification Cohort',
            type: 'Course',
            work_mode: 'remote',
            location: 'Online Course & Labs',
            min_cgpa: 6.5,
            eligible_branches: ['All'],
            eligible_grad_years: ['All'],
            stipend_range: '100% Free Sponsored Certification Voucher ($200 value)',
            deadline: addDays(20),
            required_skills: ['Google Cloud Platform', 'Docker', 'Kubernetes', 'Linux'],
            description: 'Intensive 8-week bootcamp covering enterprise cloud topology, hybrid networking, security IAM, and real Google Cloud console labs.',
            apply_link: 'https://cloud.google.com/certification'
          },
          {
            company: 'Microsoft India',
            title: 'Microsoft AI Engineer (Azure AI-102) Masterclass Cohort',
            type: 'Course',
            work_mode: 'remote',
            location: 'Online',
            min_cgpa: 6.5,
            eligible_branches: ['All'],
            eligible_grad_years: ['All'],
            stipend_range: 'Sponsored Exam Voucher + Hands-on Sandbox',
            deadline: addDays(28),
            required_skills: ['Python', 'REST APIs', 'Machine Learning'],
            description: 'Comprehensive guided program covering Azure Cognitive Services, Computer Vision, Speech AI, and OpenAI integration.',
            apply_link: 'https://learn.microsoft.com/certifications/azure-ai-engineer'
          }
        ];

        // Clear existing opportunities and insert all 42+
        await run('DELETE FROM opportunities');
        for (const opp of opportunitiesList) {
          const companyId = companyMap.get(opp.company) || null;
          await run(
            `INSERT INTO opportunities (
              title, company, company_id, type, description, required_skills, location,
              work_mode, work_type, employment_type, experience_level, min_cgpa,
              eligible_branches, eligible_grad_years, min_salary, max_salary,
              stipend_range, deadline, apply_link, posted_by, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')`,
            [
              opp.title,
              opp.company,
              companyId,
              opp.type,
              opp.description,
              JSON.stringify(opp.required_skills),
              opp.location,
              opp.work_mode,
              opp.work_mode,
              opp.type === 'Internship' ? 'internship' : 'full-time',
              opp.type === 'Internship' ? 'entry' : 'entry',
              opp.min_cgpa,
              JSON.stringify(opp.eligible_branches),
              JSON.stringify(opp.eligible_grad_years),
              opp.min_salary || null,
              opp.max_salary || null,
              opp.stipend_range || null,
              opp.deadline,
              opp.apply_link,
              recruiterUser?.id || null
            ]
          );
        }

        // 6. Learning Resources
        const learningResources = [
          // Full-Stack Developer
          {
            role: 'Full-Stack Developer',
            gap_area: 'React',
            title: 'Modern React 19 Full Course with Hooks & State Management',
            url: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
            resource_type: 'youtube',
            thumbnail_url: 'https://img.youtube.com/vi/bMknfKXIFA8/hqdefault.jpg'
          },
          {
            role: 'Full-Stack Developer',
            gap_area: 'Node.js',
            title: 'Node.js and Express.js Full Backend Architecture Course',
            url: 'https://www.youtube.com/watch?v=Oe421EPjeBE',
            resource_type: 'youtube',
            thumbnail_url: 'https://img.youtube.com/vi/Oe421EPjeBE/hqdefault.jpg'
          },
          {
            role: 'Full-Stack Developer',
            gap_area: 'TypeScript',
            title: 'TypeScript Full Tutorial for Beginners to Pro',
            url: 'https://www.youtube.com/watch?v=BwuLxPH8IDs',
            resource_type: 'youtube',
            thumbnail_url: 'https://img.youtube.com/vi/BwuLxPH8IDs/hqdefault.jpg'
          },
          {
            role: 'Full-Stack Developer',
            gap_area: 'PostgreSQL',
            title: 'PostgreSQL Full Course - Relational Database Design & Indexing',
            url: 'https://www.youtube.com/watch?v=qw--VYLpxG4',
            resource_type: 'youtube',
            thumbnail_url: 'https://img.youtube.com/vi/qw--VYLpxG4/hqdefault.jpg'
          },
          {
            role: 'Full-Stack Developer',
            gap_area: 'REST APIs',
            title: 'REST API Architectural Patterns and Scalable Endpoints Guide',
            url: 'https://www.freecodecamp.org/news/rest-api-design-best-practices-build-a-rest-api/',
            resource_type: 'article',
            thumbnail_url: null
          },
          {
            role: 'Full-Stack Developer',
            gap_area: 'Tailwind CSS',
            title: 'Tailwind CSS Full Course - Modern Responsive Web Design',
            url: 'https://www.youtube.com/watch?v=lCxcTsOHrjo',
            resource_type: 'youtube',
            thumbnail_url: 'https://img.youtube.com/vi/lCxcTsOHrjo/hqdefault.jpg'
          },

          // Backend Engineer
          {
            role: 'Backend Engineer',
            gap_area: 'Docker',
            title: 'Docker & Containerization Tutorial for Developers',
            url: 'https://www.youtube.com/watch?v=fqMOX6JJhGo',
            resource_type: 'youtube',
            thumbnail_url: 'https://img.youtube.com/vi/fqMOX6JJhGo/hqdefault.jpg'
          },
          {
            role: 'Backend Engineer',
            gap_area: 'Redis',
            title: 'Redis In-Memory Caching, Queues, and Distributed Locks',
            url: 'https://www.youtube.com/watch?v=jgpVdJB2sKQ',
            resource_type: 'youtube',
            thumbnail_url: 'https://img.youtube.com/vi/jgpVdJB2sKQ/hqdefault.jpg'
          },
          {
            role: 'Backend Engineer',
            gap_area: 'Microservices',
            title: 'Microservices Architecture & System Design Fundamentals',
            url: 'https://www.youtube.com/watch?v=CdBtQk91-BA',
            resource_type: 'youtube',
            thumbnail_url: 'https://img.youtube.com/vi/CdBtQk91-BA/hqdefault.jpg'
          },
          {
            role: 'Backend Engineer',
            gap_area: 'Python',
            title: 'Python for Backend & Systems Programming',
            url: 'https://www.youtube.com/watch?v=rfscVS0vtbw',
            resource_type: 'youtube',
            thumbnail_url: 'https://img.youtube.com/vi/rfscVS0vtbw/hqdefault.jpg'
          },
          {
            role: 'Backend Engineer',
            gap_area: 'AWS',
            title: 'AWS Cloud Architecture and Serverless Services Course',
            url: 'https://www.youtube.com/watch?v=SOTamWNgDKc',
            resource_type: 'youtube',
            thumbnail_url: 'https://img.youtube.com/vi/SOTamWNgDKc/hqdefault.jpg'
          },
          {
            role: 'Backend Engineer',
            gap_area: 'System Design',
            title: 'System Design Interview Preparation Full Guide',
            url: 'https://www.youtube.com/watch?v=m8Icp_Cid5o',
            resource_type: 'youtube',
            thumbnail_url: 'https://img.youtube.com/vi/m8Icp_Cid5o/hqdefault.jpg'
          },

          // AI / ML Engineer
          {
            role: 'AI / Data Engineer',
            gap_area: 'PyTorch',
            title: 'PyTorch for Deep Learning & Neural Networks',
            url: 'https://www.youtube.com/watch?v=V_xro1bcAuA',
            resource_type: 'youtube',
            thumbnail_url: 'https://img.youtube.com/vi/V_xro1bcAuA/hqdefault.jpg'
          },
          {
            role: 'AI / Data Engineer',
            gap_area: 'Pandas',
            title: 'Pandas & NumPy Data Analysis Masterclass',
            url: 'https://www.youtube.com/watch?v=r-uOLxNrNk8',
            resource_type: 'youtube',
            thumbnail_url: 'https://img.youtube.com/vi/r-uOLxNrNk8/hqdefault.jpg'
          },
          {
            role: 'AI / Data Engineer',
            gap_area: 'Machine Learning',
            title: 'Scikit-Learn Machine Learning in Python Complete Walkthrough',
            url: 'https://www.youtube.com/watch?v=0B5eIE_1vpU',
            resource_type: 'youtube',
            thumbnail_url: 'https://img.youtube.com/vi/0B5eIE_1vpU/hqdefault.jpg'
          },
          {
            role: 'AI / Data Engineer',
            gap_area: 'FastAPI',
            title: 'FastAPI Complete Tutorial - High-Performance AI Microservices',
            url: 'https://www.youtube.com/watch?v=7t2alSnE2-I',
            resource_type: 'youtube',
            thumbnail_url: 'https://img.youtube.com/vi/7t2alSnE2-I/hqdefault.jpg'
          },
          {
            role: 'AI / Data Engineer',
            gap_area: 'Large Language Models',
            title: 'Large Language Models, Embeddings, and Prompt Engineering',
            url: 'https://www.youtube.com/watch?v=jKR2F-hZz_g',
            resource_type: 'youtube',
            thumbnail_url: 'https://img.youtube.com/vi/jKR2F-hZz_g/hqdefault.jpg'
          },

          // DevOps & Cloud Engineer
          {
            role: 'DevOps Engineer',
            gap_area: 'Kubernetes',
            title: 'Kubernetes Complete Course for Beginners to Production',
            url: 'https://www.youtube.com/watch?v=X48VuDVv0do',
            resource_type: 'youtube',
            thumbnail_url: 'https://img.youtube.com/vi/X48VuDVv0do/hqdefault.jpg'
          },
          {
            role: 'DevOps Engineer',
            gap_area: 'CI/CD Pipelines',
            title: 'GitHub Actions & CI/CD Pipeline Automation Masterclass',
            url: 'https://www.youtube.com/watch?v=R8_veQiYBjI',
            resource_type: 'youtube',
            thumbnail_url: 'https://img.youtube.com/vi/R8_veQiYBjI/hqdefault.jpg'
          },
          {
            role: 'DevOps Engineer',
            gap_area: 'Linux',
            title: 'Linux Command Line and System Administration Bootcamp',
            url: 'https://www.youtube.com/watch?v=wBp0Rb-ZJak',
            resource_type: 'youtube',
            thumbnail_url: 'https://img.youtube.com/vi/wBp0Rb-ZJak/hqdefault.jpg'
          }
        ];

        await run('DELETE FROM learning_resources');
        for (const lr of learningResources) {
          await run(
            `INSERT INTO learning_resources (role, gap_area, title, url, resource_type, thumbnail_url)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [lr.role, lr.gap_area, lr.title, lr.url, lr.resource_type, lr.thumbnail_url]
          );
        }

        // 7. Quiz Questions
        const quizQuestions = [
          {
            position: 'Frontend Developer',
            question: 'What is the purpose of useEffect dependency array in React?',
            options: JSON.stringify([
              'To specify which states or props trigger re-execution of the effect',
              'To list all components that can import this effect',
              'To define CSS styles for the hook',
              'To connect the component to Redux store'
            ]),
            correct_answer: 0,
            explanation: 'The dependency array controls when React re-invokes the effect callback when dependencies change.',
            difficulty: 'easy'
          },
          {
            position: 'Frontend Developer',
            question: 'In React 18, what does automatic batching do?',
            options: JSON.stringify([
              'Combines state updates inside promises, timeouts, and native event handlers into a single re-render',
              'Compiles JSX ahead of time in the browser',
              'Automatically caches all fetch responses',
              'Minifies CSS bundles during development'
            ]),
            correct_answer: 0,
            explanation: 'React 18 batches multiple state updates together regardless of where they originate (async or sync).',
            difficulty: 'medium'
          },
          {
            position: 'Backend Engineer',
            question: 'What is the main benefit of connection pooling in PostgreSQL?',
            options: JSON.stringify([
              'Eliminates the high TCP handshake and auth overhead of establishing a new connection per request',
              'Automatically encrypts database tables with AES-256',
              'Replaces foreign key constraints with in-memory checks',
              'Prevents all SQL injection vulnerabilities automatically'
            ]),
            correct_answer: 0,
            explanation: 'Connection pooling keeps reusable database connections open, drastically lowering latency under high request loads.',
            difficulty: 'medium'
          },
          {
            position: 'Backend Engineer',
            question: 'Which HTTP status code is most appropriate for a request blocked due to rate limiting?',
            options: JSON.stringify(['400 Bad Request', '401 Unauthorized', '429 Too Many Requests', '503 Service Unavailable']),
            correct_answer: 2,
            explanation: 'HTTP 429 indicates the client has sent too many requests in a given amount of time.',
            difficulty: 'easy'
          },
          {
            position: 'DevOps Engineer',
            question: 'What is the primary role of a Kubernetes Ingress Controller?',
            options: JSON.stringify([
              'Manages external HTTP/HTTPS routing and TLS termination to internal cluster Services',
              'Compiles Docker images inside the node kernel',
              'Stores persistent volume snapshots to tape drives',
              'Assigns private IP addresses to hardware motherboards'
            ]),
            correct_answer: 0,
            explanation: 'An Ingress controller routes external traffic to services based on hostname or request path.',
            difficulty: 'medium'
          }
        ];

        await run('DELETE FROM quiz_questions');
        for (const q of quizQuestions) {
          await run(
            `INSERT INTO quiz_questions (position, question, options, correct_answer, explanation, difficulty)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [q.position, q.question, q.options, q.correct_answer, q.explanation, q.difficulty]
          );
        }

        console.log(`✅ Seeding completed: 42+ opportunities, ${learningResources.length} learning resources, ${quizQuestions.length} quiz questions, and complete demo student.`);
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
