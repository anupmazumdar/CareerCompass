'use strict';

const express = require('express');
const router = express.Router();
const careerAssistant = require('../../services/careerAssistant');
const { authenticateToken } = require('../../core/authentication/auth');
const { requireRole } = require('../../core/authorization/rbac');
const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const rateLimit = require('express-rate-limit');

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many AI requests. Please wait a minute before trying again.'
  }
});

const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string().min(1).max(4000)
    })
  ).min(1, 'At least one message is required')
});

// POST /api/ai/chat (Grounded student career assistant)
router.post('/chat', authenticateToken, requireRole('student'), aiLimiter, validate(chatRequestSchema), async (req, res, next) => {
  try {
    const { messages } = req.body;
    const result = await careerAssistant.chat({
      userId: req.user.userId,
      messages
    });

    return res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
