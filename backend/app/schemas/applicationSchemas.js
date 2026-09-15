'use strict';

const { z } = require('zod');

const createApplicationSchema = z.object({
  jobId: z.coerce.number().int().positive('Valid jobId is required'),
  resumeId: z.coerce.number().int().positive().optional().nullable(),
  coverNote: z.string().max(2000, 'Cover note cannot exceed 2000 characters').optional().nullable(),
  status: z.enum(['saved', 'applied']).default('applied')
});

const updateStatusSchema = z.object({
  status: z.enum([
    'saved',
    'applied',
    'under_review',
    'shortlisted',
    'interview',
    'selected',
    'rejected',
    'withdrawn'
  ]),
  notes: z.string().max(1000).optional().nullable()
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
