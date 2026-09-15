'use strict';

const db = require('../core/database/connection');

class RecruiterRepository {
  async findByUserId(userId) {
    return db.get(
      `SELECT rp.*, u.email, u.full_name, u.phone, c.name as company_name, c.logo_url as company_logo, c.verification_status
       FROM recruiter_profiles rp
       JOIN users u ON rp.user_id = u.id
       LEFT JOIN companies c ON rp.company_id = c.id
       WHERE rp.user_id = ?`,
      [userId]
    );
  }

  async findById(profileId) {
    return db.get(
      `SELECT rp.*, u.email, u.full_name, u.phone, c.name as company_name, c.logo_url as company_logo
       FROM recruiter_profiles rp
       JOIN users u ON rp.user_id = u.id
       LEFT JOIN companies c ON rp.company_id = c.id
       WHERE rp.id = ?`,
      [profileId]
    );
  }

  async createProfile(userId, { companyId, designation, department, isCompanyAdmin = false }) {
    const res = await db.run(
      `INSERT INTO recruiter_profiles (user_id, company_id, designation, department, is_company_admin)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, companyId || null, designation || null, department || null, isCompanyAdmin ? 1 : 0]
    );
    return this.findById(res.lastID);
  }

  // Company management
  async findCompanyById(companyId) {
    return db.get('SELECT * FROM companies WHERE id = ?', [companyId]);
  }

  async findCompanyByName(name) {
    return db.get('SELECT * FROM companies WHERE name = ? COLLATE NOCASE', [name]);
  }

  async createCompany({ name, website, domain, logoUrl, description, industry, verificationStatus = 'pending' }) {
    const res = await db.run(
      `INSERT INTO companies (name, website, domain, logo_url, description, industry, verification_status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, website || null, domain || null, logoUrl || null, description || null, industry || null, verificationStatus]
    );
    return this.findCompanyById(res.lastID);
  }

  async listCompanies(statusFilter = null) {
    if (statusFilter) {
      return db.all('SELECT * FROM companies WHERE verification_status = ? ORDER BY name ASC', [statusFilter]);
    }
    return db.all('SELECT * FROM companies ORDER BY name ASC');
  }

  async updateCompanyVerification(companyId, status) {
    await db.run('UPDATE companies SET verification_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, companyId]);
    return this.findCompanyById(companyId);
  }
}

module.exports = new RecruiterRepository();
