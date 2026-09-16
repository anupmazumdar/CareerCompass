'use strict';

const db = require('../../backend/app/core/database/connection');
const { hashPassword } = require('../../backend/app/core/authentication/auth');

async function seed() {
  console.log('🚀 Seeding 30 Realistic Career Opportunities and 1 Complete Demo Student Profile...');

  // 1. Companies & Recruiter
  const companiesData = [
    { name: 'Razorpay', website: 'https://razorpay.com', industry: 'Fintech & Payments' },
    { name: 'Zoho Corporation', website: 'https://zoho.com', industry: 'Enterprise SaaS' },
    { name: 'Freshworks', website: 'https://freshworks.com', industry: 'Customer Software' },
    { name: 'Microsoft India', website: 'https://microsoft.com', industry: 'Cloud & AI' },
    { name: 'Flipkart', website: 'https://flipkart.com', industry: 'E-Commerce' },
    { name: 'Swiggy', website: 'https://swiggy.com', industry: 'FoodTech & Quick Commerce' },
    { name: 'Google India', website: 'https://google.com', industry: 'Search & Cloud' },
    { name: 'Atlassian', website: 'https://atlassian.com', industry: 'Productivity & DevOps' },
    { name: 'PhonePe', website: 'https://phonepe.com', industry: 'Digital Payments' },
    { name: 'CRED', website: 'https://cred.club', industry: 'Fintech Rewards' },
    { name: 'TCS Digital', website: 'https://tcs.com', industry: 'Digital Consulting' },
    { name: 'Zomato', website: 'https://zomato.com', industry: 'Food Delivery' },
    { name: 'Cisco Systems', website: 'https://cisco.com', industry: 'Networking & Security' },
    { name: 'Oracle India', website: 'https://oracle.com', industry: 'Database & Cloud' },
    { name: 'Postman', website: 'https://postman.com', industry: 'API Platform' },
    { name: 'Zerodha', website: 'https://zerodha.com', industry: 'Discount Broking & Fintech' },
    { name: 'Zepto', website: 'https://zeptonow.com', industry: 'Quick Commerce' },
    { name: 'BrowserStack', website: 'https://browserstack.com', industry: 'Cloud Testing' },
    { name: 'Hasura', website: 'https://hasura.io', industry: 'GraphQL & Data APIs' },
    { name: 'Urban Company', website: 'https://urbancompany.com', industry: 'Home Services Marketplace' }
  ];

  const companyMap = new Map();
  for (const c of companiesData) {
    let row = await db.get('SELECT id FROM companies WHERE name = ?', [c.name]);
    if (!row) {
      const res = await db.run(
        `INSERT INTO companies (name, website, industry, verification_status)
         VALUES (?, ?, ?, 'verified')`,
        [c.name, c.website, c.industry]
      );
      companyMap.set(c.name, res.lastID);
    } else {
      companyMap.set(c.name, row.id);
    }
  }

  // Ensure standard employer user
  let employerUser = await db.get('SELECT id FROM users WHERE email = ?', ['employer@careercompass.io']);
  if (!employerUser) {
    const pHash = await hashPassword('EmployerPass123!');
    const uRes = await db.run(
      `INSERT INTO users (email, password_hash, role, full_name, status)
       VALUES (?, ?, 'recruiter', 'Campus Hiring Lead', 'active')`,
      ['employer@careercompass.io', pHash]
    );
    employerUser = { id: uRes.lastID };
  }

  // 2. Clear previous opportunities to avoid stale records
  await db.run('DELETE FROM opportunities');

  // Dates helpers: now + X days
  const addDays = (d) => {
    const date = new Date(Date.now() + d * 86400000);
    return date.toISOString().split('T')[0] + 'T23:59:59Z';
  };

  // 3. Define 30 Opportunities (15 Internships, 15 Full-Time Jobs)
  const opportunities = [
    // 15 Internships
    {
      company: 'Razorpay',
      title: 'Backend Engineering Intern',
      type: 'Internship',
      work_mode: 'hybrid',
      location: 'Bangalore, India',
      min_cgpa: 7.5,
      eligible_branches: ['Computer Science', 'Information Technology', 'MCA'],
      eligible_grad_years: ['2025', '2026'],
      stipend_range: '₹50,000 - ₹65,000 / month',
      deadline: addDays(4), // Closing soon!
      required_skills: ['Node.js', 'PostgreSQL', 'Redis', 'Docker'],
      description: 'Build robust payment settlement pipelines handling billions in GMV. Work with Node.js microservices, distributed transaction management, and low-latency caching.',
      apply_link: 'https://razorpay.com/careers/internships'
    },
    {
      company: 'CRED',
      title: 'Frontend Product Engineering Intern',
      type: 'Internship',
      work_mode: 'onsite',
      location: 'Bangalore, India',
      min_cgpa: 8.0,
      eligible_branches: ['Computer Science', 'Information Technology', 'MCA', 'Electronics'],
      eligible_grad_years: ['2025', '2026'],
      stipend_range: '₹75,000 - ₹90,000 / month',
      deadline: addDays(6), // Closing soon!
      required_skills: ['React', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
      description: 'Design and build world-class web experiences with fluid animations, micro-interactions, and instant sub-second rendering for high-net-worth members.',
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
      deadline: addDays(8), // Closing soon!
      required_skills: ['React', 'Node.js', 'MongoDB', 'JavaScript'],
      description: 'Join the consumer app team to engineer high-scale ordering workflows, live order tracking maps, and merchant partner portals.',
      apply_link: 'https://swiggy.com/careers'
    },
    {
      company: 'Postman',
      title: 'API Infrastructure Intern',
      type: 'Internship',
      work_mode: 'remote',
      location: 'Remote / Flexible',
      min_cgpa: 0.0,
      eligible_branches: ['All'],
      eligible_grad_years: ['2025', '2026'],
      stipend_range: '₹60,000 - ₹75,000 / month',
      deadline: addDays(11), // Closing soon!
      required_skills: ['TypeScript', 'Node.js', 'Docker', 'REST APIs'],
      description: 'Contribute to the world’s leading API platform used by 30 million developers. Build open-source developer tooling, CLI extensions, and testing suites.',
      apply_link: 'https://postman.com/careers'
    },
    {
      company: 'Microsoft India',
      title: 'Cloud & DevOps Intern',
      type: 'Internship',
      work_mode: 'hybrid',
      location: 'Hyderabad, India',
      min_cgpa: 8.0,
      eligible_branches: ['Computer Science', 'Information Technology', 'MCA'],
      eligible_grad_years: ['2025', '2026'],
      stipend_range: '₹80,000 - ₹1,00,000 / month',
      deadline: addDays(13), // Closing soon!
      required_skills: ['Python', 'Docker', 'Kubernetes', 'AWS'],
      description: 'Design automated CI/CD pipelines, monitor multi-region cloud clusters on Azure/AWS, and automate infrastructure provisioning using Terraform.',
      apply_link: 'https://careers.microsoft.com'
    },
    {
      company: 'Zerodha',
      title: 'Systems & Backend Intern',
      type: 'Internship',
      work_mode: 'remote',
      location: 'Bangalore / Remote',
      min_cgpa: 0.0,
      eligible_branches: ['All'],
      eligible_grad_years: ['2025', '2026'],
      stipend_range: '₹50,000 - ₹70,000 / month',
      deadline: addDays(18),
      required_skills: ['Python', 'PostgreSQL', 'Go', 'Linux'],
      description: 'Learn high-throughput financial trading systems engineering. Work with clean Unix philosophies, minimal dependencies, and lightning-fast database queries.',
      apply_link: 'https://zerodha.com/careers'
    },
    {
      company: 'Zomato',
      title: 'Data & Analytics Intern',
      type: 'Internship',
      work_mode: 'hybrid',
      location: 'Gurgaon, India',
      min_cgpa: 7.0,
      eligible_branches: ['All'],
      eligible_grad_years: ['2025', '2026'],
      stipend_range: '₹40,000 - ₹55,000 / month',
      deadline: addDays(22),
      required_skills: ['Python', 'SQL', 'PostgreSQL', 'Machine Learning'],
      description: 'Build predictive demand models, optimize delivery partner allocation algorithms, and create real-time operational analytics dashboards.',
      apply_link: 'https://zomato.com/careers'
    },
    {
      company: 'Hasura',
      title: 'Developer Relations & Tools Intern',
      type: 'Internship',
      work_mode: 'remote',
      location: 'Remote',
      min_cgpa: 0.0,
      eligible_branches: ['All'],
      eligible_grad_years: ['2025', '2026'],
      stipend_range: '₹45,000 - ₹60,000 / month',
      deadline: addDays(25),
      required_skills: ['GraphQL', 'React', 'Node.js', 'PostgreSQL'],
      description: 'Create sample apps, documentation guides, and developer workflows using Hasura GraphQL engine with Postgres and cloud databases.',
      apply_link: 'https://hasura.io/careers'
    },
    {
      company: 'BrowserStack',
      title: 'QA Automation Engineering Intern',
      type: 'Internship',
      work_mode: 'hybrid',
      location: 'Mumbai, India',
      min_cgpa: 7.0,
      eligible_branches: ['Computer Science', 'MCA', 'Information Technology'],
      eligible_grad_years: ['2025', '2026'],
      stipend_range: '₹40,000 - ₹50,000 / month',
      deadline: addDays(28),
      required_skills: ['JavaScript', 'Python', 'Git', 'Testing'],
      description: 'Build automated end-to-end testing frameworks across mobile and browser cloud matrices. Write maintainable regression suites.',
      apply_link: 'https://browserstack.com/careers'
    },
    {
      company: 'Zepto',
      title: 'Supply Chain Tech Intern',
      type: 'Internship',
      work_mode: 'onsite',
      location: 'Bangalore, India',
      min_cgpa: 7.5,
      eligible_branches: ['Computer Science', 'MCA'],
      eligible_grad_years: ['2025', '2026'],
      stipend_range: '₹50,000 - ₹65,000 / month',
      deadline: addDays(32),
      required_skills: ['Java', 'Spring Boot', 'PostgreSQL', 'Docker'],
      description: 'Scale dark store management software powering 10-minute grocery deliveries. Architect microservices for real-time inventory synchronization.',
      apply_link: 'https://zeptonow.com/careers'
    },
    {
      company: 'Atlassian',
      title: 'Software Engineer Intern',
      type: 'Internship',
      work_mode: 'remote',
      location: 'Bangalore / Remote',
      min_cgpa: 8.0,
      eligible_branches: ['Computer Science', 'Information Technology', 'MCA'],
      eligible_grad_years: ['2025', '2026'],
      stipend_range: '₹75,000 - ₹95,000 / month',
      deadline: addDays(35),
      required_skills: ['Java', 'React', 'AWS', 'Docker'],
      description: 'Contribute to Jira and Confluence Cloud features. Participate in agile sprints, code reviews, and ship features tested by millions of knowledge workers.',
      apply_link: 'https://atlassian.com/careers'
    },
    {
      company: 'Freshworks',
      title: 'Customer Experience Platform Intern',
      type: 'Internship',
      work_mode: 'hybrid',
      location: 'Chennai, India',
      min_cgpa: 7.0,
      eligible_branches: ['All'],
      eligible_grad_years: ['2025', '2026'],
      stipend_range: '₹35,000 - ₹45,000 / month',
      deadline: addDays(40),
      required_skills: ['React', 'JavaScript', 'HTML/CSS', 'Node.js'],
      description: 'Build modern customer support widgets and CRM web extensions. Focus on accessibility, cross-browser compatibility, and modular design systems.',
      apply_link: 'https://freshworks.com/careers'
    },
    {
      company: 'Urban Company',
      title: 'Partner Operations Tech Intern',
      type: 'Internship',
      work_mode: 'hybrid',
      location: 'Gurgaon, India',
      min_cgpa: 7.2,
      eligible_branches: ['All'],
      eligible_grad_years: ['2025', '2026'],
      stipend_range: '₹40,000 - ₹55,000 / month',
      deadline: addDays(45),
      required_skills: ['Node.js', 'MongoDB', 'React', 'TypeScript'],
      description: 'Develop tools for partner onboarding, payout automation, and scheduling across thousands of home service professionals.',
      apply_link: 'https://urbancompany.com/careers'
    },
    {
      company: 'Cisco Systems',
      title: 'Network Security Intern',
      type: 'Internship',
      work_mode: 'hybrid',
      location: 'Bangalore, India',
      min_cgpa: 7.5,
      eligible_branches: ['Computer Science', 'MCA', 'Information Technology'],
      eligible_grad_years: ['2025', '2026'],
      stipend_range: '₹60,000 - ₹75,000 / month',
      deadline: addDays(50),
      required_skills: ['Python', 'Linux', 'Git', 'Networking'],
      description: 'Automate security compliance auditing, packet inspection tooling, and container vulnerability scanning across enterprise networks.',
      apply_link: 'https://cisco.com/careers'
    },
    {
      company: 'Zoho Corporation',
      title: 'Web Engineering Intern',
      type: 'Internship',
      work_mode: 'onsite',
      location: 'Chennai, India',
      min_cgpa: 0.0,
      eligible_branches: ['All'],
      eligible_grad_years: ['2025', '2026'],
      stipend_range: '₹30,000 - ₹40,000 / month',
      deadline: addDays(55),
      required_skills: ['JavaScript', 'HTML/CSS', 'Java', 'SQL'],
      description: 'Learn Zoho’s proprietary web engine and enterprise application framework. Write high-performance vanilla JavaScript and clean Java backends.',
      apply_link: 'https://zoho.com/careers'
    },

    // 15 Full-Time Jobs (Entry-Level SDE / MCA Graduate Roles)
    {
      company: 'Microsoft India',
      title: 'Software Development Engineer - I',
      type: 'Job',
      work_mode: 'hybrid',
      location: 'Hyderabad / Bangalore',
      min_cgpa: 8.0,
      eligible_branches: ['Computer Science', 'Information Technology', 'MCA'],
      eligible_grad_years: ['2024', '2025'],
      min_salary: 1600000,
      max_salary: 2400000,
      deadline: addDays(5), // Closing soon!
      required_skills: ['C++', 'Python', 'Azure', 'Data Structures', 'Docker'],
      description: 'Join Azure Core Infrastructure. Build hyper-scale cloud virtualization services, zero-downtime microservices, and distributed consensus algorithms.',
      apply_link: 'https://careers.microsoft.com'
    },
    {
      company: 'Flipkart',
      title: 'Associate Software Development Engineer (SDE-1)',
      type: 'Job',
      work_mode: 'hybrid',
      location: 'Bangalore, India',
      min_cgpa: 7.5,
      eligible_branches: ['Computer Science', 'Information Technology', 'MCA'],
      eligible_grad_years: ['2024', '2025'],
      min_salary: 1400000,
      max_salary: 1800000,
      deadline: addDays(7), // Closing soon!
      required_skills: ['Java', 'Spring Boot', 'Kafka', 'MySQL', 'Docker'],
      description: 'Architect order fulfilment, checkout, and inventory locking mechanisms during Big Billion Days. Handle 100,000 requests/sec with low latency.',
      apply_link: 'https://flipkart.com/careers'
    },
    {
      company: 'Zoho Corporation',
      title: 'Member Technical Staff - Full Stack Developer',
      type: 'Job',
      work_mode: 'onsite',
      location: 'Chennai / Tenkasi',
      min_cgpa: 0.0,
      eligible_branches: ['All'],
      eligible_grad_years: ['2024', '2025'],
      min_salary: 750000,
      max_salary: 1100000,
      deadline: addDays(9), // Closing soon!
      required_skills: ['React', 'Java', 'SQL', 'JavaScript', 'HTML/CSS'],
      description: 'Own end-to-end product features for Zoho Workplace and Zoho Books. Work on clean UI components, modular backend REST APIs, and database migrations.',
      apply_link: 'https://zoho.com/careers'
    },
    {
      company: 'PhonePe',
      title: 'Software Engineer - Payments Platform',
      type: 'Job',
      work_mode: 'onsite',
      location: 'Bangalore, India',
      min_cgpa: 7.8,
      eligible_branches: ['Computer Science', 'MCA', 'Information Technology'],
      eligible_grad_years: ['2024', '2025'],
      min_salary: 1500000,
      max_salary: 2000000,
      deadline: addDays(12), // Closing soon!
      required_skills: ['Java', 'PostgreSQL', 'Redis', 'Kafka', 'Docker'],
      description: 'Engineer high-reliability payment switch software connecting to NPCI and banking gateways. Zero tolerance for data inconsistency or dropped transactions.',
      apply_link: 'https://phonepe.com/careers'
    },
    {
      company: 'Google India',
      title: 'Associate Cloud Engineer',
      type: 'Job',
      work_mode: 'hybrid',
      location: 'Bangalore / Gurgaon',
      min_cgpa: 8.5,
      eligible_branches: ['Computer Science', 'Information Technology', 'MCA'],
      eligible_grad_years: ['2024', '2025'],
      min_salary: 1800000,
      max_salary: 2500000,
      deadline: addDays(14), // Closing soon!
      required_skills: ['Python', 'Go', 'Kubernetes', 'GCP', 'Linux'],
      description: 'Help enterprise clients deploy scalable microservices on Google Cloud Platform. Build telemetry, observability, and container orchestrations.',
      apply_link: 'https://google.com/careers'
    },
    {
      company: 'Razorpay',
      title: 'Frontend Software Engineer - Merchant Dashboard',
      type: 'Job',
      work_mode: 'hybrid',
      location: 'Bangalore, India',
      min_cgpa: 7.0,
      eligible_branches: ['All'],
      eligible_grad_years: ['2024', '2025'],
      min_salary: 1200000,
      max_salary: 1700000,
      deadline: addDays(20),
      required_skills: ['React', 'TypeScript', 'Tailwind CSS', 'Redux', 'Next.js'],
      description: 'Build fast, accessible, and responsive dashboards used by 8 million merchants to manage payments, refunds, analytics, and business payouts.',
      apply_link: 'https://razorpay.com/careers'
    },
    {
      company: 'Swiggy',
      title: 'Software Development Engineer - Delivery Logistics',
      type: 'Job',
      work_mode: 'hybrid',
      location: 'Bangalore, India',
      min_cgpa: 7.2,
      eligible_branches: ['Computer Science', 'Information Technology', 'MCA'],
      eligible_grad_years: ['2024', '2025'],
      min_salary: 1300000,
      max_salary: 1800000,
      deadline: addDays(24),
      required_skills: ['Node.js', 'Go', 'PostgreSQL', 'Docker', 'AWS'],
      description: 'Optimize routing, batching, and dispatch logic across thousands of delivery partners in real time. Work with geospatial indexing and Redis.',
      apply_link: 'https://swiggy.com/careers'
    },
    {
      company: 'Postman',
      title: 'Full Stack Engineer - Collaboration Workspace',
      type: 'Job',
      work_mode: 'remote',
      location: 'Remote',
      min_cgpa: 0.0,
      eligible_branches: ['All'],
      eligible_grad_years: ['2024', '2025'],
      min_salary: 1400000,
      max_salary: 1900000,
      deadline: addDays(27),
      required_skills: ['React', 'Node.js', 'TypeScript', 'GraphQL', 'Docker'],
      description: 'Build real-time collaborative workspace tools allowing engineering teams to mock, document, monitor, and test APIs together seamlessly.',
      apply_link: 'https://postman.com/careers'
    },
    {
      company: 'TCS Digital',
      title: 'Digital Systems Engineer (MCA / B.Tech Cohort)',
      type: 'Job',
      work_mode: 'hybrid',
      location: 'Kolkata / Bangalore / Mumbai',
      min_cgpa: 7.0,
      eligible_branches: ['Computer Science', 'MCA', 'Information Technology'],
      eligible_grad_years: ['2024', '2025'],
      min_salary: 750000,
      max_salary: 950000,
      deadline: addDays(30),
      required_skills: ['Java', 'Python', 'SQL', 'Spring Boot', 'React'],
      description: 'Prestigious TCS Digital cadre offering accelerated growth for top engineering and MCA students working on enterprise cloud transformations.',
      apply_link: 'https://tcs.com/careers'
    },
    {
      company: 'Oracle India',
      title: 'Cloud Applications Developer',
      type: 'Job',
      work_mode: 'hybrid',
      location: 'Bangalore / Noida',
      min_cgpa: 7.5,
      eligible_branches: ['Computer Science', 'MCA', 'Information Technology'],
      eligible_grad_years: ['2024', '2025'],
      min_salary: 1100000,
      max_salary: 1550000,
      deadline: addDays(34),
      required_skills: ['Java', 'SQL', 'Oracle DB', 'Docker', 'Linux'],
      description: 'Build modern enterprise ERP modules, optimize complex transactional database queries, and automate integration pipelines on Oracle Cloud.',
      apply_link: 'https://oracle.com/careers'
    },
    {
      company: 'Cisco Systems',
      title: 'Software Engineer - Cloud Security',
      type: 'Job',
      work_mode: 'hybrid',
      location: 'Bangalore, India',
      min_cgpa: 7.8,
      eligible_branches: ['Computer Science', 'Information Technology', 'MCA'],
      eligible_grad_years: ['2024', '2025'],
      min_salary: 1450000,
      max_salary: 1950000,
      deadline: addDays(38),
      required_skills: ['Python', 'C++', 'Docker', 'Linux', 'AWS'],
      description: 'Architect cloud-delivered network security solutions. Develop telemetry collectors, threat intelligence parsers, and Zero Trust access filters.',
      apply_link: 'https://cisco.com/careers'
    },
    {
      company: 'Atlassian',
      title: 'Junior DevOps & Site Reliability Engineer',
      type: 'Job',
      work_mode: 'remote',
      location: 'Bangalore / Remote',
      min_cgpa: 8.0,
      eligible_branches: ['Computer Science', 'Information Technology', 'MCA'],
      eligible_grad_years: ['2024', '2025'],
      min_salary: 1700000,
      max_salary: 2300000,
      deadline: addDays(42),
      required_skills: ['AWS', 'Kubernetes', 'Docker', 'Python', 'Terraform'],
      description: 'Maintain 99.99% availability for Jira, Bitbucket, and Confluence. Automate disaster recovery, cluster scaling, and distributed tracing.',
      apply_link: 'https://atlassian.com/careers'
    },
    {
      company: 'Zerodha',
      title: 'Full Stack Web Developer',
      type: 'Job',
      work_mode: 'remote',
      location: 'Bangalore / Remote',
      min_cgpa: 0.0,
      eligible_branches: ['All'],
      eligible_grad_years: ['2024', '2025'],
      min_salary: 1300000,
      max_salary: 1800000,
      deadline: addDays(46),
      required_skills: ['Vue.js', 'React', 'Go', 'Python', 'PostgreSQL'],
      description: 'Build minimalist, super-fast investment portals and educational tools. Work with WebSockets, charting libraries, and high-frequency trade data.',
      apply_link: 'https://zerodha.com/careers'
    },
    {
      company: 'Zepto',
      title: 'Backend Engineer - Real-Time Inventory',
      type: 'Job',
      work_mode: 'onsite',
      location: 'Bangalore, India',
      min_cgpa: 7.2,
      eligible_branches: ['Computer Science', 'MCA'],
      eligible_grad_years: ['2024', '2025'],
      min_salary: 1350000,
      max_salary: 1850000,
      deadline: addDays(52),
      required_skills: ['Node.js', 'PostgreSQL', 'Redis', 'Kafka', 'Docker'],
      description: 'Design instant inventory reservation systems. Ensure zero out-of-stock items shown to users across hundreds of quick-commerce fulfillment nodes.',
      apply_link: 'https://zeptonow.com/careers'
    },
    {
      company: 'Freshworks',
      title: 'Associate Software Engineer - CRM Cloud',
      type: 'Job',
      work_mode: 'hybrid',
      location: 'Chennai / Hyderabad',
      min_cgpa: 7.0,
      eligible_branches: ['All'],
      eligible_grad_years: ['2024', '2025'],
      min_salary: 900000,
      max_salary: 1300000,
      deadline: addDays(58),
      required_skills: ['Ruby on Rails', 'React', 'MySQL', 'JavaScript', 'AWS'],
      description: 'Develop features for Freshdesk and Freshsales. Work on omnichannel messaging integrations, AI ticket routing, and RESTful webhook engines.',
      apply_link: 'https://freshworks.com/careers'
    }
  ];

  for (const opp of opportunities) {
    const compId = companyMap.get(opp.company) || null;
    await db.run(
      `INSERT INTO opportunities (
        title, company, company_id, type, description, required_skills,
        location, work_mode, work_type, employment_type, min_cgpa,
        eligible_branches, eligible_grad_years, min_salary, max_salary,
        stipend_range, deadline, apply_link, posted_by, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')`,
      [
        opp.title,
        opp.company,
        compId,
        opp.type,
        opp.description,
        JSON.stringify(opp.required_skills),
        opp.location,
        opp.work_mode,
        opp.work_mode,
        opp.type === 'Internship' ? 'internship' : 'full-time',
        opp.min_cgpa,
        JSON.stringify(opp.eligible_branches),
        JSON.stringify(opp.eligible_grad_years),
        opp.min_salary || null,
        opp.max_salary || null,
        opp.stipend_range || null,
        opp.deadline,
        opp.apply_link,
        employerUser.id
      ]
    );
  }
  console.log(`✅ Seeded ${opportunities.length} opportunities into database.`);

  // 4. Seed Complete Demo Student Profile ("Alex Chen")
  const studentEmail = 'alex.chen@compass.edu';
  let demoUser = await db.get('SELECT id FROM users WHERE email = ?', [studentEmail]);
  if (!demoUser) {
    const studentPass = await hashPassword('StudentPass123!');
    const uRes = await db.run(
      `INSERT INTO users (email, password_hash, role, full_name, phone, status)
       VALUES (?, ?, 'student', 'Alex Chen', '+91 98765 43210', 'active')`,
      [studentEmail, studentPass]
    );
    demoUser = { id: uRes.lastID };
  } else {
    await db.run('UPDATE users SET phone = "+91 98765 43210" WHERE id = ?', [demoUser.id]);
  }

  let studentProfile = await db.get('SELECT id FROM student_profiles WHERE user_id = ?', [demoUser.id]);
  if (!studentProfile) {
    const spRes = await db.run(
      `INSERT INTO student_profiles (
        user_id, headline, bio, location, college, degree, branch,
        current_semester, graduation_year, cgpa, achievements,
        preferred_role, preferred_roles, preferred_location, preferred_locations,
        work_mode_preference
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        demoUser.id,
        'Full-Stack Developer & Aspiring Cloud Architect | MCA \'25',
        'Passionate Master of Computer Applications candidate specializing in distributed systems, modern React frontends, and Node.js microservices. Winner of HackNIT 2024.',
        'Bangalore, India',
        'National Institute of Technology',
        'Master of Computer Applications (MCA)',
        'Computer Applications & Software Engineering',
        4,
        2025,
        8.8,
        JSON.stringify(['Winner - HackNIT 2024', 'Top 5% in LeetCode Global Contest', 'AWS Certified Cloud Practitioner']),
        'Software Engineer',
        JSON.stringify(['Software Engineer', 'Full Stack Developer', 'Backend Engineer']),
        'Bangalore',
        JSON.stringify(['Bangalore', 'Hyderabad', 'Remote']),
        'hybrid'
      ]
    );
    studentProfile = { id: spRes.lastID };
  } else {
    await db.run(
      `UPDATE student_profiles
       SET headline = ?, bio = ?, location = ?, college = ?, degree = ?, branch = ?,
           current_semester = 4, graduation_year = 2025, cgpa = 8.8,
           achievements = ?, preferred_roles = ?, preferred_locations = ?,
           work_mode_preference = 'hybrid'
       WHERE id = ?`,
      [
        'Full-Stack Developer & Aspiring Cloud Architect | MCA \'25',
        'Passionate Master of Computer Applications candidate specializing in distributed systems, modern React frontends, and Node.js microservices. Winner of HackNIT 2024.',
        'Bangalore, India',
        'National Institute of Technology',
        'Master of Computer Applications (MCA)',
        'Computer Applications & Software Engineering',
        JSON.stringify(['Winner - HackNIT 2024', 'Top 5% in LeetCode Global Contest', 'AWS Certified Cloud Practitioner']),
        JSON.stringify(['Software Engineer', 'Full Stack Developer', 'Backend Engineer']),
        JSON.stringify(['Bangalore', 'Hyderabad', 'Remote']),
        studentProfile.id
      ]
    );
  }

  // Skills for Alex Chen
  const studentSkills = [
    { name: 'React', level: 'expert', years: 2 },
    { name: 'Node.js', level: 'expert', years: 2 },
    { name: 'TypeScript', level: 'intermediate', years: 1 },
    { name: 'PostgreSQL', level: 'intermediate', years: 2 },
    { name: 'Docker', level: 'intermediate', years: 1 },
    { name: 'AWS', level: 'beginner', years: 1 },
    { name: 'Python', level: 'intermediate', years: 2 }
  ];

  for (const s of studentSkills) {
    let skillRow = await db.get('SELECT id FROM skills WHERE LOWER(canonical_name) = ?', [s.name.toLowerCase()]);
    if (!skillRow) {
      const sRes = await db.run('INSERT INTO skills (canonical_name, category) VALUES (?, "technical")', [s.name]);
      skillRow = { id: sRes.lastID };
    }
    await db.run(
      `INSERT OR REPLACE INTO student_skills (student_id, skill_id, proficiency_level, source, confidence_score)
       VALUES (?, ?, ?, 'manual', 1.0)`,
      [studentProfile.id, skillRow.id, s.level]
    );
  }

  // Resumes for Alex Chen (1 Primary, 1 Secondary)
  await db.run('DELETE FROM resumes WHERE student_id = ?', [studentProfile.id]);
  const r1 = await db.run(
    `INSERT INTO resumes (student_id, file_name, file_path, mime_type, file_size, version_label, is_primary)
     VALUES (?, 'Alex_Chen_SDE_Resume_v2.pdf', '/uploads/resumes/alex_sde_v2.pdf', 'application/pdf', 104800, 'v2-sde-primary', 1)`,
    [studentProfile.id]
  );
  const r2 = await db.run(
    `INSERT INTO resumes (student_id, file_name, file_path, mime_type, file_size, version_label, is_primary)
     VALUES (?, 'Alex_Chen_FullStack_v1.pdf', '/uploads/resumes/alex_fullstack_v1.pdf', 'application/pdf', 98200, 'v1-fullstack', 0)`,
    [studentProfile.id]
  );

  // Projects
  await db.run('DELETE FROM student_projects WHERE student_id = ?', [studentProfile.id]);
  await db.run(
    `INSERT INTO student_projects (student_id, title, description, technologies, github_url)
     VALUES (?, 'Distributed E-Commerce Microservices Platform', 'Architected and deployed microservices backend with Node.js, RabbitMQ, and Redis caching. Handled 5000 concurrent req/sec.', '["Node.js", "Redis", "PostgreSQL", "Docker", "RabbitMQ"]', 'https://github.com/alexchen/distributed-ecommerce')`,
    [studentProfile.id]
  );
  await db.run(
    `INSERT INTO student_projects (student_id, title, description, technologies, github_url)
     VALUES (?, 'AI Resume Screener & ATS Parser', 'Full stack application using React, Tailwind CSS, and Python FastAPI for automated resume evaluation against JDs.', '["React", "Python", "FastAPI", "Tailwind CSS"]', 'https://github.com/alexchen/ai-resume-screener')`,
    [studentProfile.id]
  );

  // Certifications
  await db.run('DELETE FROM student_certifications WHERE student_id = ?', [studentProfile.id]);
  await db.run(
    `INSERT INTO student_certifications (student_id, title, issuing_organization, issue_date, credential_id)
     VALUES (?, 'AWS Certified Cloud Practitioner', 'Amazon Web Services', '2024-05', 'AWS-CCP-983421')`,
    [studentProfile.id]
  );
  await db.run(
    `INSERT INTO student_certifications (student_id, title, issuing_organization, issue_date, credential_id)
     VALUES (?, 'Meta Front-End Developer Professional Certificate', 'Meta (Coursera)', '2023-11', 'META-FED-55421')`,
    [studentProfile.id]
  );

  // Goals
  await db.run('DELETE FROM student_goals WHERE student_id = ?', [studentProfile.id]);
  await db.run(
    `INSERT INTO student_goals (student_id, title, description, category, target_date, status)
     VALUES (?, 'Master Kubernetes & Cluster Orchestration', 'Complete hands-on CKAD labs and deploy microservices on multi-node minikube.', 'skill', '2026-10-15', 'in_progress')`,
    [studentProfile.id]
  );
  await db.run(
    `INSERT INTO student_goals (student_id, title, description, category, target_date, status)
     VALUES (?, 'Solve 100 System Design & LeetCode Hard Questions', 'Focus on distributed consensus, rate limiting, and cache invalidation patterns.', 'skill', '2026-11-01', 'in_progress')`,
    [studentProfile.id]
  );
  await db.run(
    `INSERT INTO student_goals (student_id, title, description, category, target_date, status)
     VALUES (?, 'Secure SDE Offer at Top Tech Product Firm', 'Targeting Tier-1 product startups or MNCs with minimum 16+ LPA package.', 'career', '2026-12-15', 'in_progress')`,
    [studentProfile.id]
  );

  // Tracked Applications for Alex Chen
  await db.run('DELETE FROM applications WHERE student_id = ?', [studentProfile.id]);

  const oppRows = await db.all('SELECT id, title, company FROM opportunities ORDER BY id ASC LIMIT 5');
  if (oppRows.length >= 4) {
    // 1. Saved (Razorpay)
    await db.run(
      `INSERT INTO applications (opportunity_id, student_id, resume_id, resume_version_used, status, match_score, notes)
       VALUES (?, ?, ?, 'v2-sde-primary', 'saved', 94, 'Wishlist priority #1 - Payment Gateway team')`,
      [oppRows[0].id, studentProfile.id, r1.lastID]
    );

    // 2. Applied (CRED)
    await db.run(
      `INSERT INTO applications (opportunity_id, student_id, resume_id, resume_version_used, status, match_score, notes)
       VALUES (?, ?, ?, 'v2-sde-primary', 'applied', 88, 'Submitted full application and portfolio site')`,
      [oppRows[1].id, studentProfile.id, r1.lastID]
    );

    // 3. Under Review (Swiggy)
    await db.run(
      `INSERT INTO applications (opportunity_id, student_id, resume_id, resume_version_used, status, match_score, notes)
       VALUES (?, ?, ?, 'v2-sde-primary', 'under_review', 85, 'Resume screening passed, pending coding assessment')`,
      [oppRows[2].id, studentProfile.id, r1.lastID]
    );

    // 4. Interview Scheduled (Postman)
    const interviewDate = new Date(Date.now() + 3 * 86400000).toISOString();
    const app4 = await db.run(
      `INSERT INTO applications (opportunity_id, student_id, resume_id, resume_version_used, status, match_score, notes, reminder_date)
       VALUES (?, ?, ?, 'v2-sde-primary', 'interview', 91, 'Technical Round 1 on Zoom with Staff API Engineer', ?)`,
      [oppRows[3].id, studentProfile.id, r1.lastID, interviewDate]
    );

    // Add note for Postman interview
    await db.run(
      `INSERT INTO application_notes (application_id, student_id, note_type, content, reminder_date)
       VALUES (?, ?, 'interview_prep', 'Review API rate limiting, RFC 7231 status codes, and Webhook security HMAC signing.', ?)`,
      [app4.lastID, studentProfile.id, interviewDate]
    );
  }

  console.log('✅ Demo student profile "Alex Chen" seeded with 92% completeness, skills, projects, goals, and 4 applications.');
  console.log('🎉 Seed operation finished successfully!');
}

seed()
  .catch((err) => {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  })
  .then(() => process.exit(0));
