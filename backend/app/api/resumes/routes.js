// backend/app/api/resumes/routes.js
'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch (e) {
  console.warn('⚠️ pdf-parse not available:', e.message);
}

let mammoth;
try {
  mammoth = require('mammoth');
} catch (e) {
  console.warn('⚠️ mammoth not available:', e.message);
}
const path = require('path');
const crypto = require('crypto');
const db = require('../../core/database/connection');
const { authenticateToken } = require('../../core/authentication/auth');
const { requireRole } = require('../../core/authorization/rbac');
const { resumeUploadLimiter } = require('../../core/security/security');
const resumeService = require('../../services/resume/resumeService');
const studentRepo = require('../../repositories/studentRepository');

// Helper to prevent hung document parser execution / decompression bombs
async function parseWithTimeout(promise, timeoutMs = 5000) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('PARSER_TIMEOUT')), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}

// Configure Multer in-memory storage (5 MB cap)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Magic bytes validation helper
function validateFileMagicBytes(buffer, mimeType) {
  if (!buffer || buffer.length < 4) return false;

  // PDF Magic Bytes: %PDF- (0x25, 0x50, 0x44, 0x46)
  if (mimeType.includes('pdf') || buffer.slice(0, 4).toString('ascii') === '%PDF') {
    return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
  }

  // DOCX / ZIP Magic Bytes: PK\x03\x04 (0x50, 0x4b, 0x03, 0x04)
  if (mimeType.includes('word') || mimeType.includes('document')) {
    return buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
  }

  return false;
}

// POST /api/resumes/analyze - Analyze resume text for ATS score
router.post('/analyze', authenticateToken, async (req, res, next) => {
  try {
    const { text, targetRole } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'Resume text is required as a string' });
    }
    if (text.length > 50000) {
      return res.status(400).json({ success: false, error: 'PAYLOAD_TOO_LARGE', message: 'Resume text exceeds maximum limit of 50,000 characters' });
    }
    if (targetRole && (typeof targetRole !== 'string' || targetRole.length > 100)) {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'Target role must be a string under 100 characters' });
    }
    const analysis = await resumeService.analyzeResume(text, targetRole);
    res.json({ success: true, analysis });
  } catch (err) {
    next(err);
  }
});

// POST /api/resumes/upload - Secure PDF/DOCX Resume Upload with Magic-Byte Check & Skill Extraction
router.post('/upload', authenticateToken, requireRole('student'), resumeUploadLimiter, upload.single('resume'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Resume file is required (PDF or DOCX, max 5MB)'
      });
    }

    const { originalname, mimetype, size, buffer } = req.file;

    // 1. Extension & Path Safety Check
    const ext = path.extname(originalname || '').toLowerCase();
    if (!['.pdf', '.docx'].includes(ext)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_FILE_EXTENSION',
        message: 'Security check failed: Only .pdf and .docx file extensions are allowed.'
      });
    }

    // 2. Double Validation: MIME Type + Magic Byte Inspection
    const isValidSignature = validateFileMagicBytes(buffer, mimetype);
    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_FILE_SIGNATURE',
        message: 'Security check failed: File header magic bytes do not match declared file type.'
      });
    }

    // 2. Extract Raw Text from Buffer with Timeout Guard
    let extractedText = '';
    if (mimetype.includes('pdf') || originalname.toLowerCase().endsWith('.pdf')) {
      try {
        const pdfModule = require('pdf-parse');
        if (typeof pdfModule === 'function') {
          const parsed = await parseWithTimeout(pdfModule(buffer), 5000);
          extractedText = parsed?.text || '';
        } else if (pdfModule && typeof pdfModule.PDFParse === 'function') {
          const parser = new pdfModule.PDFParse({ data: buffer });
          const textRes = await parseWithTimeout(parser.getText(), 5000);
          if (parser.destroy) await parser.destroy();
          extractedText = typeof textRes === 'string' ? textRes : (textRes?.text || '');
        }
      } catch (_) {
        extractedText = buffer.toString('utf-8');
      }
      if (!extractedText) extractedText = buffer.toString('utf-8');
    } else if (mimetype.includes('word') || originalname.toLowerCase().endsWith('.docx')) {
      try {
        const parsedDocx = await parseWithTimeout(mammoth.extractRawText({ buffer }), 5000);
        extractedText = parsedDocx?.value || '';
      } catch (_) {
        extractedText = buffer.toString('utf-8');
      }
    } else {
      extractedText = buffer.toString('utf-8');
    }

    // 3. Scan & Auto-Suggest Skills from Known Catalog
    const allSkills = await db.all('SELECT id, canonical_name FROM skills WHERE is_active = 1');
    const lowerText = extractedText.toLowerCase();
    const detectedSkills = [];

    allSkills.forEach(skill => {
      const name = skill.canonical_name.toLowerCase();
      // Whole word matching for skills to avoid false positives (e.g., 'c' in 'cat')
      const regex = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(lowerText)) {
        detectedSkills.push({
          id: skill.id,
          name: skill.canonical_name
        });
      }
    });

    // 4. Calculate ATS Score & Quality Feedback
    const targetRole = req.body.targetRole || 'Software Engineer';
    const analysis = await resumeService.analyzeResume(extractedText, targetRole);

    // 5. Link to Student Profile
    const studentProfile = await studentRepo.findByUserId(req.user.userId);
    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Student profile not found'
      });
    }

    // Check maximum 3 resumes
    const existingResumes = await db.all('SELECT id, is_primary FROM resumes WHERE student_id = ?', [studentProfile.id]);
    if (existingResumes.length >= 3) {
      return res.status(400).json({
        success: false,
        error: 'LIMIT_REACHED',
        message: 'Maximum 3 resume versions allowed. Delete an existing version to upload a new one.'
      });
    }

    const versionLabel = req.body.version_label || req.body.versionLabel || `v${existingResumes.length + 1}`;
    const shouldBePrimary = existingResumes.length === 0 || req.body.is_primary === 'true' || req.body.is_primary === true;

    if (shouldBePrimary && existingResumes.length > 0) {
      await db.run('UPDATE resumes SET is_primary = 0 WHERE student_id = ?', [studentProfile.id]);
    }

    const safeFileId = `${crypto.randomUUID()}${ext}`;
    const safeFilePath = `uploads/resumes/${safeFileId}`;
    const sanitizedFileName = path.basename(originalname).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);

    const saveRes = await db.run(
      `INSERT INTO resumes (student_id, file_name, file_path, mime_type, file_size, raw_text, version_label, is_primary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [studentProfile.id, sanitizedFileName, safeFilePath, mimetype, size, extractedText.slice(0, 8000), versionLabel, shouldBePrimary ? 1 : 0]
    );
    const resumeId = saveRes.lastID;

    // Also record in resume_analysis table
    if (resumeId) {
      await db.run(
        `INSERT OR REPLACE INTO resume_analysis (resume_id, ats_score, detected_skills, analyzed_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [resumeId, analysis.atsScore || 70, JSON.stringify(detectedSkills.map(s => s.name))]
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Resume uploaded, verified, and parsed successfully',
      data: {
        resumeId,
        fileName: originalname,
        fileSize: size,
        mimeType: mimetype,
        atsScore: analysis.atsScore || 75,
        feedback: analysis.feedback,
        detectedSkills,
        previewText: extractedText.slice(0, 300) + '...'
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
