const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');
const setupService = require('./setupService');
const config = require('../config/config');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite3').verbose();

class AutoSetupService {
  constructor() {
    this.dbPath = path.join(process.cwd(), 'data', 'database.sqlite');
    this.envPath = path.join(process.cwd(), 'data', '.env');
  }

  async setupDatabase() {
    // Create the database if it doesn't exist
    try {
      await fs.access(this.dbPath);
      console.log('Database already exists');
    } catch (error) {
      console.log('Creating database...');
      const db = new sqlite3.Database(this.dbPath);
      
      // Create users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE,
          password TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create processed_documents table
      db.run(`
        CREATE TABLE IF NOT EXISTS processed_documents (
          id INTEGER PRIMARY KEY,
          title TEXT,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create document_history table
      db.run(`
        CREATE TABLE IF NOT EXISTS document_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          document_id INTEGER,
          tags TEXT,
          title TEXT,
          correspondent TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create original_data table
      db.run(`
        CREATE TABLE IF NOT EXISTS original_data (
          document_id INTEGER PRIMARY KEY,
          tags TEXT,
          correspondent TEXT,
          title TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create openai_metrics table
      db.run(`
        CREATE TABLE IF NOT EXISTS openai_metrics (
          document_id INTEGER PRIMARY KEY,
          prompt_tokens INTEGER,
          completion_tokens INTEGER,
          total_tokens INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.close();
    }
  }

  async createAdminUser() {
    // Check if admin credentials are defined in .env
    if (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD) {
      console.log('Admin credentials not defined in .env');
      return false;
    }
    
    const username = process.env.ADMIN_USER;
    const password = process.env.ADMIN_PASSWORD;
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Open the database
    const db = new sqlite3.Database(this.dbPath);
    
    // Check if user exists
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
          db.close();
          reject(err);
          return;
        }
        
        if (row) {
          console.log('Admin user already exists');
          db.close();
          resolve(true);
          return;
        }
        
        // Create the admin user
        db.run(
          'INSERT INTO users (username, password) VALUES (?, ?)',
          [username, hashedPassword],
          function(err) {
            db.close();
            if (err) {
              reject(err);
              return;
            }
            
            console.log('Admin user created successfully');
            resolve(true);
          }
        );
      });
    });
  }

  async performAutoSetup() {
    try {
      // Check if .env exists and is configured
      const isConfigured = await setupService.isConfigured();
      if (isConfigured) {
        console.log('System is already configured');
        return true;
      }
      
      // Setup the database
      await this.setupDatabase();
      
      // Create admin user
      await this.createAdminUser();
      
      // Mark as configured in config.js
      config.CONFIGURED = true;
      
      return true;
    } catch (error) {
      console.error('Auto setup failed:', error);
      return false;
    }
  }
}

module.exports = new AutoSetupService();