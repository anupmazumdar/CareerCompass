'use strict';

const { z } = require('zod');

const personalProfileSchema = z.object({
  headline: z.string().max(200).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  location: z.string().max(120).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  college: z.string().max(200).optional().nullable(),
  degree: z.string().max(100).optional().nullable(),
  branch: z.string().max(100).optional().nullable(),
  current_semester: z.coerce.number().int().min(1).max(12).optional().nullable(),
  graduation_year: z.coerce.number().int().min(2000).max(2040).optional().nullable(),
  cgpa: z.coerce.number().min(0).max(10).optional().nullable(),
  achievements: z.union([z.string().max(3000), z.array(z.string())]).optional().nullable(),
  github_url: z.string().url().optional().nullable().or(z.literal('')),
  linkedin_url: z.string().url().optional().nullable().or(z.literal('')),
  portfolio_url: z.string().url().optional().nullable().or(z.literal('')),
  preferred_role: z.string().max(120).optional().nullable(),
  preferred_roles: z.array(z.string()).optional().nullable(),
  preferred_location: z.string().max(120).optional().nullable(),
  preferred_locations: z.array(z.string()).optional().nullable(),
  work_mode_preference: z.enum(['remote', 'hybrid', 'onsite', 'any']).optional().nullable(),
  is_public: z.boolean().optional().nullable()
});

const educationSchema = z.object({
  institution: z.string().min(2, 'Institution name is required').max(200),
  degree: z.string().min(2, 'Degree is required').max(100),
  field_of_study: z.string().max(100).optional().nullable().default('Computer Science / IT'),
  start_year: z.coerce.number().int().min(1970).max(2040),
  end_year: z.coerce.number().int().min(1970).max(2040).optional().nullable(),
  grade_or_cgpa: z.string().max(30).optional().nullable()
});

const projectSchema = z.object({
  title: z.string().min(2, 'Project title is required').max(150),
  description: z.string().min(10, 'Project description should be at least 10 characters').max(3000),
  technologies: z.array(z.string()).optional().default([]),
  project_url: z.string().url().optional().nullable().or(z.literal('')),
  github_url: z.string().url().optional().nullable().or(z.literal(''))
});

const certificationSchema = z.object({
  title: z.string().min(2, 'Certification title is required').max(150),
  issuing_organization: z.string().min(2, 'Issuing organization is required').max(150),
  issue_date: z.string().min(4, 'Issue date is required'),
  expiration_date: z.string().optional().nullable(),
  credential_url: z.string().url().optional().nullable().or(z.literal('')),
  credential_id: z.string().max(100).optional().nullable()
});

const skillSchema = z.object({
  skillId: z.coerce.number().int().positive('Valid skillId is required'),
  proficiencyLevel: z.enum(['beginner', 'intermediate', 'expert']).default('intermediate')
});

const resumeSchema = z.object({
  version_label: z.string().min(1).max(50).optional(),
  versionLabel: z.string().min(1).max(50).optional(),
  file_name: z.string().min(1).max(255).optional(),
  fileName: z.string().min(1).max(255).optional(),
  file_path: z.string().min(1).max(500).optional(),
  filePath: z.string().min(1).max(500).optional(),
  file_size: z.coerce.number().int().optional().nullable(),
  fileSize: z.coerce.number().int().optional().nullable(),
  mime_type: z.string().max(100).optional().nullable(),
  mimeType: z.string().max(100).optional().nullable(),
  raw_text: z.string().max(50000).optional().nullable(),
  rawText: z.string().max(50000).optional().nullable(),
  is_primary: z.boolean().optional().default(false),
  isPrimary: z.boolean().optional().default(false)
}).refine(data => data.file_name || data.fileName, { message: 'file_name is required' });

const goalSchema = z.object({
  title: z.string().min(2, 'Goal title is required').max(150),
  description: z.string().max(1000).optional().nullable(),
  category: z.enum(['skill', 'application', 'project', 'interview', 'other']).default('skill'),
  target_date: z.string().optional().nullable(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'archived']).default('in_progress')
});

module.exports = {
  personalProfileSchema,
  educationSchema,
  projectSchema,
  certificationSchema,
  skillSchema,
  resumeSchema,
  goalSchema
};
