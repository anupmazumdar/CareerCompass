'use strict';

const { z } = require('zod');

const personalProfileSchema = z.object({
  headline: z.string().max(200).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  location: z.string().max(120).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  github_url: z.string().url().optional().nullable().or(z.literal('')),
  linkedin_url: z.string().url().optional().nullable().or(z.literal('')),
  portfolio_url: z.string().url().optional().nullable().or(z.literal('')),
  preferred_role: z.string().max(120).optional().nullable(),
  preferred_location: z.string().max(120).optional().nullable(),
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

module.exports = {
  personalProfileSchema,
  educationSchema,
  projectSchema,
  certificationSchema,
  skillSchema
};
