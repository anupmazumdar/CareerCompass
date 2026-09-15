'use strict';

const db = require('../core/database/connection');

class UserRepository {
  async findByEmail(email) {
    if (!email) return null;
    return db.get('SELECT * FROM users WHERE email = ? AND deleted_at IS NULL', [email.toLowerCase()]);
  }

  async findById(id) {
    return db.get('SELECT * FROM users WHERE id = ? AND deleted_at IS NULL', [id]);
  }

  async create({ email, passwordHash, role, fullName, phone, status = 'active' }) {
    const res = await db.run(
      `INSERT INTO users (email, password_hash, role, full_name, phone, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [email.toLowerCase(), passwordHash, role, fullName, phone, status]
    );
    return this.findById(res.lastID);
  }

  async updateStatus(id, status) {
    await db.run('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);
    return this.findById(id);
  }

  async softDelete(id) {
    return db.run('UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
  }

  async findAll(roleFilter = null) {
    if (roleFilter) {
      return db.all('SELECT id, email, role, full_name, phone, status, created_at FROM users WHERE role = ? AND deleted_at IS NULL', [roleFilter]);
    }
    return db.all('SELECT id, email, role, full_name, phone, status, created_at FROM users WHERE deleted_at IS NULL');
  }
}

module.exports = new UserRepository();
