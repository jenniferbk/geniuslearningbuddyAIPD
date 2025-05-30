const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database setup and schema creation
function setupDatabase() {
  const dbPath = path.join(__dirname, 'ai_literacy_buddy.db');
  const db = new sqlite3.Database(dbPath);

  console.log('Setting up database schema...');

  // Enable foreign keys and run setup in series
  db.serialize(() => {
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        grade_level TEXT DEFAULT 'mixed',
        subjects TEXT DEFAULT '[]',
        tech_comfort TEXT DEFAULT 'medium',
        learning_style TEXT DEFAULT 'mixed',
        goals TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_active DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creating users table:', err);
      else console.log('✓ Users table created');
    });

    // Memory entities table
    db.run(`
      CREATE TABLE IF NOT EXISTS memory_entities (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        entity_name TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        observations TEXT DEFAULT '[]',
        confidence REAL DEFAULT 0.5,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error('Error creating memory_entities table:', err);
      else console.log('✓ Memory entities table created');
    });

    // Memory relations table
    db.run(`
      CREATE TABLE IF NOT EXISTS memory_relations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        from_entity TEXT NOT NULL,
        to_entity TEXT NOT NULL,
        relation_type TEXT NOT NULL,
        strength REAL DEFAULT 0.5,
        evidence TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error('Error creating memory_relations table:', err);
      else console.log('✓ Memory relations table created');
    });

    // Conversations table
    db.run(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        messages TEXT NOT NULL,
        module_context TEXT DEFAULT 'basic_ai_literacy',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error('Error creating conversations table:', err);
      else console.log('✓ Conversations table created');
    });

    // Learning progress table
    db.run(`
      CREATE TABLE IF NOT EXISTS learning_progress (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        module_id TEXT NOT NULL,
        completion_percentage REAL DEFAULT 0.0,
        competencies TEXT DEFAULT '{}',
        current_topic TEXT,
        struggles TEXT DEFAULT '[]',
        achievements TEXT DEFAULT '[]',
        last_interaction DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error('Error creating learning_progress table:', err);
      else console.log('✓ Learning progress table created');
    });

    // Create indexes for performance
    db.run('CREATE INDEX IF NOT EXISTS idx_memory_entities_user_id ON memory_entities (user_id)', (err) => {
      if (err) console.error('Error creating memory_entities index:', err);
      else console.log('✓ Memory entities index created');
    });
    
    db.run('CREATE INDEX IF NOT EXISTS idx_memory_relations_user_id ON memory_relations (user_id)', (err) => {
      if (err) console.error('Error creating memory_relations index:', err);
      else console.log('✓ Memory relations index created');
    });
    
    db.run('CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations (user_id)', (err) => {
      if (err) console.error('Error creating conversations index:', err);
      else console.log('✓ Conversations index created');
    });
    
    db.run('CREATE INDEX IF NOT EXISTS idx_learning_progress_user_id ON learning_progress (user_id)', (err) => {
      if (err) console.error('Error creating learning_progress index:', err);
      else console.log('✓ Learning progress index created');
    });

    console.log('\n🎉 Database setup complete! All tables and indexes created.');
  });
  
  // Close database connection
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed successfully.');
    }
  });
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };
