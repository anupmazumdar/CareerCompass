'use strict';

const db = require('../../backend/app/core/database/connection');

const LEARNING_RESOURCES = [
  // Full-Stack Web Developer
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

  // Backend & Cloud Engineer
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

  // Data Scientist & AI/ML Engineer
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
    gap_area: 'LLMs & GenAI',
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
    title: 'Linux Command Line and System Administration Basics',
    url: 'https://www.youtube.com/watch?v=ZtqBQ68cfJc',
    resource_type: 'youtube',
    thumbnail_url: 'https://img.youtube.com/vi/ZtqBQ68cfJc/hqdefault.jpg'
  },
  {
    role: 'DevOps Engineer',
    gap_area: 'Terraform',
    title: 'Terraform Infrastructure as Code (IaC) Masterclass',
    url: 'https://www.youtube.com/watch?v=7xngnjfIlK4',
    resource_type: 'youtube',
    thumbnail_url: 'https://img.youtube.com/vi/7xngnjfIlK4/hqdefault.jpg'
  },

  // Frontend Engineer
  {
    role: 'Frontend Developer',
    gap_area: 'Tailwind CSS',
    title: 'Tailwind CSS From Zero to Production Masterclass',
    url: 'https://www.youtube.com/watch?v=ft30zcMlFao',
    resource_type: 'youtube',
    thumbnail_url: 'https://img.youtube.com/vi/ft30zcMlFao/hqdefault.jpg'
  },
  {
    role: 'Frontend Developer',
    gap_area: 'Next.js',
    title: 'Next.js 14 Complete Tutorial - App Router & Server Components',
    url: 'https://www.youtube.com/watch?v=ZVnjOPwW4ZA',
    resource_type: 'youtube',
    thumbnail_url: 'https://img.youtube.com/vi/ZVnjOPwW4ZA/hqdefault.jpg'
  },
  {
    role: 'Frontend Developer',
    gap_area: 'Web Performance',
    title: 'Web Performance Optimization and Core Web Vitals Deep Dive',
    url: 'https://web.dev/learn/performance',
    resource_type: 'documentation',
    thumbnail_url: null
  }
];

async function seedLearningResources() {
  console.log('🌱 Seeding Curated Learning Resources for CareerPath...');

  await db.run('DELETE FROM learning_resources');

  for (const res of LEARNING_RESOURCES) {
    await db.run(
      `INSERT INTO learning_resources (role, gap_area, title, url, resource_type, thumbnail_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [res.role, res.gap_area, res.title, res.url, res.resource_type, res.thumbnail_url]
    );
  }

  const count = await db.get('SELECT COUNT(*) as total FROM learning_resources');
  console.log(`✅ Seeded ${count.total} curated free learning resources successfully!`);
}

if (require.main === module) {
  seedLearningResources()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}

module.exports = { seedLearningResources };
