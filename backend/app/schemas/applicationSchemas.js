'use strict';

const { z } = require('zod');

const createApplicationSchema = z.object({
  opportunityId: z.coerce.number().int().positive().optional().nullable(),
  jobId: z.coerce.number().int().positive().optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  title: z.string().max(200).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  resumeId: z.coerce.number().int().positive().optional().nullable(),
  coverNote: z.string().max(2000, 'Cover note cannot exceed 2000 characters').optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  reminderDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional().nullable(),
  status: z.enum([
    'saved',
    'applied',
    'under_review',
    'shortlisted',
    'interview',
    'selected',
    'offer',
    'rejected',
    'withdrawn'
  ]).default('applied')
}).refine(data => data.opportunityId || data.jobId || (data.company && data.title), {
  message: 'Either opportunityId, jobId, or both company and title are required'
});

const updateStatusSchema = z.object({
  status: z.enum([
    'saved',
    'applied',
    'under_review',
    'shortlisted',
    'interview',
    'selected',
    'offer',
    'rejected',
    'withdrawn'
  ]),
  notes: z.string().max(2000).optional().nullable(),
  reminderDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional().nullable()
});

const addNoteSchema = z.object({
  content: z.string().min(1, 'Note content is required').max(2000, 'Note content cannot exceed 2000 characters'),
  noteType: z.enum(['general', 'interview_prep', 'follow_up', 'offer_details']).default('general'),
  reminderDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional().nullable()
});

module.exports = {
  createApplicationSchema,
  updateStatusSchema,
  addNoteSchema
};
