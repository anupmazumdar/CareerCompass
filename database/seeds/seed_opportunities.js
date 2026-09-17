'use strict';

const db = require('../../backend/app/core/database/connection');
const { hashPassword } = require('../../backend/app/core/authentication/auth');

async function seedOpportunitiesAndStudents() {
  console.log('🌱 Seeding 15 realistic industry opportunities & varied student cohorts...');

  // 1. Seed Recruiter & Companies
  const companies = [
    { name: 'Razorpay', website: 'https://razorpay.com', industry: 'Fintech & Payments', logo: '💳' },
    { name: 'Zoho Corporation', website: 'https://zoho.com', industry: 'SaaS & Enterprise Cloud', logo: '⚡' },
    { name: 'Freshworks', website: 'https://freshworks.com', industry: 'Customer Engagement SaaS', logo: '🎯' },
    { name: 'Microsoft India', website: 'https://microsoft.com', industry: 'Cloud & AI Infrastructure', logo: '💻' },
    { name: 'Flipkart', website: 'https://flipkart.com', industry: 'E-Commerce & Supply Chain', logo: '🛍️' },
    { name: 'Infosys', website: 'https://infosys.com', industry: 'IT & Digital Transformation', logo: '🌐' },
    { name: 'Swiggy', website: 'https://swiggy.com', industry: 'Hyperlocal Logistics & FoodTech', logo: '🛵' },
    { name: 'Google India', website: 'https://google.com', industry: 'Information Retrieval & AI', logo: '🔍' },
    { name: 'Atlassian', website: 'https://atlassian.com', industry: 'Developer Tools & Collaboration', logo: '🚀' },
    { name: 'PhonePe', website: 'https://phonepe.com', industry: 'Digital Payments & Lending', logo: '📱' },
    { name: 'CRED', website: 'https://cred.club', industry: 'Fintech & Premium Rewards', logo: '💎' },
    { name: 'Tata Consultancy Services', website: 'https://tcs.com', industry: 'Global IT Consulting', logo: '🏢' },
    { name: 'Zomato', website: 'https://zomato.com', industry: 'Food Delivery & Quick Commerce', logo: '🍽️' },
    { name: 'Cisco Systems', website: 'https://cisco.com', industry: 'Networking & Cybersecurity', logo: '🛡️' },
    { name: 'Oracle India', website: 'https://oracle.com', industry: 'Cloud Database & ERP Systems', logo: '📊' }
  ];

  const companyMap = new Map();
  for (const c of companies) {
    const existing = await db.get('SELECT id FROM companies WHERE name = ?', [c.name]);
    if (existing) {
      companyMap.set(c.name, existing.id);
    } else {
      const res = await db.run(
        `INSERT INTO companies (name, website, industry, verification_status)
         VALUES (?, ?, ?, 'verified')`,
        [c.name, c.website, c.industry]
      );
      companyMap.set(c.name, res.lastID);
    }
  }

  // Ensure standard recruiter user
  let recruiterUser = await db.get('SELECT id FROM users WHERE email = ?', ['recruiter@talentai.platform']);
  if (!recruiterUser) {
    const pHash = await hashPassword('RecruiterPass123!');
    const uRes = await db.run(
      `INSERT INTO users (email, password_hash, role, full_name, status)
       VALUES (?, ?, 'recruiter', 'Campus Talent Director', 'active')`,
      ['recruiter@talentai.platform', pHash]
    );
    recruiterUser = { id: uRes.lastID };
  }

  // recruiter_profiles removed in CareerCompass
  let recruiterProfile = null;

  // Helper to resolve skill IDs
  const allSkills = await db.all('SELECT id, canonical_name FROM skills');
  const skillIdMap = new Map();
  allSkills.forEach(s => skillIdMap.set(s.canonical_name.toLowerCase(), s.id));

  const sampleOpportunities = [
    {
      company: 'Razorpay',
      title: 'Backend Engineering Intern',
      department: 'Core Payments Gateway',
      location: 'Bangalore, India (Hybrid)',
      employmentType: 'internship',
      experienceLevel: 'entry',
      minExperienceYears: 0,
      minEducation: 'Bachelor',
      minSalary: 45000,
      maxSalary: 60000,
      deadline: '2026-11-15',
      description: 'Join the Core Payments team at Razorpay to architect high-throughput microservices handling millions of transactions daily. Build resilient Node.js / Go services with PostgreSQL and Redis.',
      skills: ['Node.js', 'PostgreSQL', 'Redis', 'Docker']
    },
    {
      company: 'Zoho Corporation',
      title: 'Frontend Software Engineer',
      department: 'Zoho Workplace Suite',
      location: 'Chennai, India (Onsite)',
      employmentType: 'full-time',
      experienceLevel: 'entry',
      minExperienceYears: 0,
      minEducation: 'Bachelor',
      minSalary: 650000,
      maxSalary: 950000,
      deadline: '2026-10-30',
      description: 'Craft responsive, accessible web applications for over 100 million global users. Deep mastery of React, modern JavaScript/TypeScript, state management, and web performance optimization required.',
      skills: ['React', 'JavaScript', 'TypeScript', 'HTML/CSS']
    },
    {
      company: 'Freshworks',
      title: 'Cloud Platform Engineering Intern',
      department: 'Infrastructure Platform',
      location: 'Remote, India',
      employmentType: 'internship',
      experienceLevel: 'entry',
      minExperienceYears: 0,
      minEducation: 'Bachelor',
      minSalary: 40000,
      maxSalary: 55000,
      deadline: '2026-11-05',
      description: 'Scale multi-tenant AWS and Kubernetes infrastructure. Write automation scripts in Python, build CI/CD pipelines, and monitor real-time cloud observability metrics.',
      skills: ['AWS', 'Docker', 'Kubernetes', 'Python', 'CI/CD']
    },
    {
      company: 'Microsoft India',
      title: 'Software Engineer Graduate (Batch 2026)',
      department: 'Azure Core Systems',
      location: 'Hyderabad, India (Hybrid)',
      employmentType: 'full-time',
      experienceLevel: 'entry',
      minExperienceYears: 0,
      minEducation: 'Bachelor',
      minSalary: 1400000,
      maxSalary: 2200000,
      deadline: '2026-12-01',
      description: 'Work at the frontier of distributed cloud computing on Microsoft Azure. Focus on robust low-level systems, algorithms, multi-threading, C++, and high-availability architecture.',
      skills: ['C++', 'Python', 'Git', 'System Design']
    },
    {
      company: 'Flipkart',
      title: 'Data & Analytics Engineering Intern',
      department: 'Supply Chain Intelligence',
      location: 'Bangalore, India (Onsite)',
      employmentType: 'internship',
      experienceLevel: 'entry',
      minExperienceYears: 0,
      minEducation: 'Bachelor',
      minSalary: 50000,
      maxSalary: 70000,
      deadline: '2026-10-25',
      description: 'Analyze real-time demand forecasting data streams across millions of daily shipments. Utilize SQL, Python, and distributed processing to optimize warehouse routing.',
      skills: ['Python', 'SQL', 'MySQL', 'Machine Learning']
    },
    {
      company: 'Infosys',
      title: 'Associate Systems Engineer',
      department: 'Digital Modernization',
      location: 'Pune / Bhubaneswar / Kolkata',
      employmentType: 'full-time',
      experienceLevel: 'entry',
      minExperienceYears: 0,
      minEducation: 'Bachelor',
      minSalary: 400000,
      maxSalary: 620000,
      deadline: '2026-11-20',
      description: 'Participate in global enterprise software transformation projects. Work with modern enterprise Java, Spring Boot, REST APIs, relational databases, and agile software development cycles.',
      skills: ['Java', 'MySQL', 'Git', 'HTML/CSS']
    },
    {
      company: 'Swiggy',
      title: 'Full Stack Engineering Intern',
      department: 'Consumer App Experience',
      location: 'Bangalore, India (Hybrid)',
      employmentType: 'internship',
      experienceLevel: 'entry',
      minExperienceYears: 0,
      minEducation: 'Bachelor',
      minSalary: 45000,
      maxSalary: 65000,
      deadline: '2026-10-28',
      description: 'Build fast, delightful customer-facing mobile-web features for Swiggy food & Instamart quick commerce. Collaborate with product design and backend teams to release end-to-end features.',
      skills: ['React', 'Node.js', 'MongoDB', 'JavaScript']
    },
    {
      company: 'Google India',
      title: 'Software Engineering Intern (Summer 2026)',
      department: 'Google Search & Cloud',
      location: 'Bangalore / Hyderabad',
      employmentType: 'internship',
      experienceLevel: 'entry',
      minExperienceYears: 0,
      minEducation: 'Bachelor',
      minSalary: 110000,
      maxSalary: 135000,
      deadline: '2026-12-15',
      description: 'Tackle algorithmic and distributed systems challenges at global scale. Design and implement code in Go, C++, or Python, and collaborate with world-class engineers.',
      skills: ['Go', 'C++', 'Python', 'Algorithms']
    },
    {
      company: 'Atlassian',
      title: 'Site Reliability Engineering Intern',
      department: 'Jira Cloud Infrastructure',
      location: 'Remote, India',
      employmentType: 'internship',
      experienceLevel: 'entry',
      minExperienceYears: 0,
      minEducation: 'Bachelor',
      minSalary: 60000,
      maxSalary: 80000,
      deadline: '2026-11-10',
      description: 'Ensure 99.99% uptime for Jira and Confluence Cloud. Automate system recovery, monitor microservices with distributed tracing, and manage Kubernetes clusters.',
      skills: ['Docker', 'Kubernetes', 'AWS', 'Python']
    },
    {
      company: 'PhonePe',
      title: 'Mobile Web Applications Engineer',
      department: 'Merchant Solutions',
      location: 'Bangalore, India (Onsite)',
      employmentType: 'full-time',
      experienceLevel: 'entry',
      minExperienceYears: 0,
      minEducation: 'Bachelor',
      minSalary: 1100000,
      maxSalary: 1600000,
      deadline: '2026-11-18',
      description: 'Develop slick, instantaneous payment workflows for millions of merchant QR code apps. Deep knowledge of React, Next.js, and client-side offline storage.',
      skills: ['React', 'Next.js', 'TypeScript', 'JavaScript']
    },
    {
      company: 'CRED',
      title: 'Product Engineering Intern',
      department: 'CRED Garage & Commerce',
      location: 'Bangalore, India (Onsite)',
      employmentType: 'internship',
      experienceLevel: 'entry',
      minExperienceYears: 0,
      minEducation: 'Bachelor',
      minSalary: 75000,
      maxSalary: 95000,
      deadline: '2026-10-31',
      description: 'Build aesthetically stunning UI experiences with micro-animations and zero-latency backend integrations. React, Tailwind CSS, Framer Motion, and Go.',
      skills: ['React', 'HTML/CSS', 'TypeScript', 'Go']
    },
    {
      company: 'Tata Consultancy Services',
      title: 'Digital Innovator Engineer',
      department: 'TCS Interactive & AI Labs',
      location: 'Kolkata / Mumbai / Delhi',
      employmentType: 'full-time',
      experienceLevel: 'entry',
      minExperienceYears: 0,
      minEducation: 'Bachelor',
      minSalary: 700000,
      maxSalary: 900000,
      deadline: '2026-11-30',
      description: 'Engineer AI-assisted digital products for Fortune 500 enterprises. Develop with Python, Fast-API, Docker, and modern web application frontends.',
      skills: ['Python', 'FastAPI', 'Docker', 'Machine Learning']
    },
    {
      company: 'Zomato',
      title: 'Backend Systems Intern',
      department: 'Real-Time Dispatch Engine',
      location: 'Gurgaon, India (Hybrid)',
      employmentType: 'internship',
      experienceLevel: 'entry',
      minExperienceYears: 0,
      minEducation: 'Bachelor',
      minSalary: 55000,
      maxSalary: 75000,
      deadline: '2026-10-29',
      description: 'Solve geospatial dispatch optimization and routing problems for 500,000+ delivery partners. Build robust backend services with Go and PostgreSQL.',
      skills: ['Go', 'PostgreSQL', 'Redis', 'Docker']
    },
    {
      company: 'Cisco Systems',
      title: 'Network Software Engineer',
      department: 'Secure Cloud Networking',
      location: 'Bangalore, India (Hybrid)',
      employmentType: 'full-time',
      experienceLevel: 'entry',
      minExperienceYears: 0,
      minEducation: 'Bachelor',
      minSalary: 1200000,
      maxSalary: 1750000,
      deadline: '2026-12-10',
      description: 'Design networking software, software-defined networks (SDN), and automated security protocols for cloud data centers. C++, Python, and Linux systems programming.',
      skills: ['C++', 'Python', 'Git', 'Docker']
    },
    {
      company: 'Oracle India',
      title: 'Cloud Database Systems Associate',
      department: 'Oracle Cloud Infrastructure (OCI)',
      location: 'Noida / Bangalore',
      employmentType: 'full-time',
      experienceLevel: 'entry',
      minExperienceYears: 0,
      minEducation: 'Bachelor',
      minSalary: 900000,
      maxSalary: 1350000,
      deadline: '2026-11-25',
      description: 'Optimize autonomous cloud database query performance, transactional integrity, and distributed backup systems. Strong SQL, Java, and Linux foundation.',
      skills: ['Java', 'MySQL', 'SQL', 'Linux']
    }
  ];

  for (const opp of sampleOpportunities) {
    const compId = companyMap.get(opp.company);
    let job = await db.get('SELECT id FROM jobs WHERE title = ? AND company_id = ?', [opp.title, compId]);

    if (!job) {
      const jRes = await db.run(
        `INSERT INTO jobs (
          company_id, created_by_recruiter_id, title, description, department, location,
          employment_type, experience_level, min_experience_years, min_education,
          min_salary, max_salary, deadline, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')`,
        [
          compId,
          recruiterProfile.id,
          opp.title,
          opp.description,
          opp.department,
          opp.location,
          opp.employmentType,
          opp.experienceLevel,
          opp.minExperienceYears,
          opp.minEducation,
          opp.minSalary,
          opp.maxSalary,
          opp.deadline
        ]
      );
      job = { id: jRes.lastID };
    }

    // Attach skills
    for (const sName of opp.skills) {
      let sId = skillIdMap.get(sName.toLowerCase());
      if (!sId) {
        // Create skill if missing
        const sRes = await db.run(`INSERT OR IGNORE INTO skills (canonical_name, category_id) VALUES (?, 1)`, [sName]);
        sId = sRes.lastID || (await db.get('SELECT id FROM skills WHERE canonical_name = ?', [sName]))?.id;
        if (sId) skillIdMap.set(sName.toLowerCase(), sId);
      }

      if (sId) {
        await db.run(
          `INSERT OR IGNORE INTO job_skills (job_id, skill_id, is_required, weight)
           VALUES (?, ?, 1, 1.0)`,
          [job.id, sId]
        );
      }
    }
  }

  // 2. Seed 3 Student Cohort Demo Profiles
  const demoStudents = [
    {
      email: 'aarav.sharma@careerpath.edu',
      fullName: 'Aarav Sharma',
      headline: 'MCA Graduate 2026 | Full Stack & Cloud Specialist',
      bio: 'Final-year MCA student with strong background in distributed systems, React, Node.js, and cloud architectures. Won 1st place in University Hackathon.',
      location: 'Kolkata, India',
      targetRole: 'Full Stack Software Engineer',
      education: {
        institution: 'University Institute of Technology',
        degree: 'Master of Computer Applications (MCA)',
        field: 'Computer Science & Distributed Systems',
        start: 2024,
        end: 2026,
        grade: '9.2 / 10'
      },
      skills: ['React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS'],
      project: {
        title: 'Real-Time Distributed Task Scheduler',
        description: 'Fault-tolerant job scheduler built with Node.js, Redis, and Docker with worker health monitoring.',
        technologies: ['Node.js', 'Redis', 'Docker']
      },
      certification: {
        title: 'AWS Certified Cloud Practitioner',
        org: 'Amazon Web Services',
        date: '2025-06-15'
      }
    },
    {
      email: 'priya.patel@careerpath.edu',
      fullName: 'Priya Patel',
      headline: 'B.Tech IT 2026 | Frontend & UI/UX Developer',
      bio: 'Enthusiastic frontend developer passionate about creating accessible, responsive, micro-animated web interfaces.',
      location: 'Ahmedabad, India',
      targetRole: 'Frontend Developer',
      education: {
        institution: 'Gujarat Technological University',
        degree: 'Bachelor of Technology (B.Tech)',
        field: 'Information Technology',
        start: 2022,
        end: 2026,
        grade: '8.4 / 10'
      },
      skills: ['React', 'JavaScript', 'TypeScript', 'HTML/CSS'],
      project: {
        title: 'Modern E-Commerce Storefront',
        description: 'Blazing-fast responsive shopping cart experience using Next.js and Tailwind CSS.',
        technologies: ['React', 'Next.js', 'HTML/CSS']
      }
    },
    {
      email: 'rohit.verma@careerpath.edu',
      fullName: 'Rohit Verma',
      headline: 'Computer Science Student | Python & Algorithms',
      bio: 'CS student focusing on data structures, algorithmic problem-solving, and Python backend APIs.',
      location: 'Bangalore, India',
      targetRole: 'Software Engineer',
      education: {
        institution: 'Bangalore Institute of Technology',
        degree: 'Bachelor of Science (B.Sc)',
        field: 'Computer Science',
        start: 2023,
        end: 2026,
        grade: '7.8 / 10'
      },
      skills: ['Python', 'SQL']
    }
  ];

  for (const sData of demoStudents) {
    let u = await db.get('SELECT id FROM users WHERE email = ?', [sData.email]);
    if (!u) {
      const pHash = await hashPassword('StudentPass123!');
      const uRes = await db.run(
        `INSERT INTO users (email, password_hash, role, full_name, status)
         VALUES (?, ?, 'student', ?, 'active')`,
        [sData.email, pHash, sData.fullName]
      );
      u = { id: uRes.lastID };
    }

    let sp = await db.get('SELECT id FROM student_profiles WHERE user_id = ?', [u.id]);
    if (!sp) {
      const spRes = await db.run(
        `INSERT INTO student_profiles (user_id, headline, bio, location, preferred_role)
         VALUES (?, ?, ?, ?, ?)`,
        [u.id, sData.headline, sData.bio, sData.location, sData.targetRole]
      );
      sp = { id: spRes.lastID };
    }

    // Education
    if (sData.education) {
      await db.run(
        `INSERT OR IGNORE INTO student_education (student_id, institution, degree, field_of_study, start_year, end_year, grade_or_cgpa)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [sp.id, sData.education.institution, sData.education.degree, sData.education.field, sData.education.start, sData.education.end, sData.education.grade]
      );
    }

    // Skills
    if (sData.skills) {
      for (const skName of sData.skills) {
        let skId = skillIdMap.get(skName.toLowerCase());
        if (!skId) {
          const skRes = await db.run('INSERT OR IGNORE INTO skills (canonical_name, category_id) VALUES (?, 1)', [skName]);
          skId = skRes.lastID || (await db.get('SELECT id FROM skills WHERE canonical_name = ?', [skName]))?.id;
        }
        if (skId) {
          await db.run(
            `INSERT OR IGNORE INTO student_skills (student_id, skill_id, proficiency_level, source)
             VALUES (?, ?, 'intermediate', 'manual')`,
            [sp.id, skId]
          );
        }
      }
    }

    // Project
    if (sData.project) {
      await db.run(
        `INSERT OR IGNORE INTO student_projects (student_id, title, description, technologies)
         VALUES (?, ?, ?, ?)`,
        [sp.id, sData.project.title, sData.project.description, JSON.stringify(sData.project.technologies)]
      );
    }

    // Certification
    if (sData.certification) {
      await db.run(
        `INSERT OR IGNORE INTO student_certifications (student_id, title, issuing_organization, issue_date)
         VALUES (?, ?, ?, ?)`,
        [sp.id, sData.certification.title, sData.certification.org, sData.certification.date]
      );
    }
  }

  console.log('✅ Successfully seeded 15 industry opportunities and 3 student demo cohorts!');
}

if (require.main === module) {
  seedOpportunitiesAndStudents()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}

module.exports = { seedOpportunitiesAndStudents };
