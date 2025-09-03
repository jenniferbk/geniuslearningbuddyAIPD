const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database enhancements for improved memory system performance
function enhanceDatabase() {
  const dbPath = path.join(__dirname, 'learning_buddy.db');
  const db = new sqlite3.Database(dbPath);

  console.log('🔧 Enhancing database for improved memory system performance...');

  db.serialize(() => {
    // Enhanced indexes for better memory query performance
    console.log('📊 Adding enhanced performance indexes...');
    
    // Memory entities indexes
    db.run(`CREATE INDEX IF NOT EXISTS idx_memory_entities_type_user 
            ON memory_entities (user_id, entity_type)`, (err) => {
      if (err) console.error('Error creating memory_entities type index:', err);
      else console.log('✓ Memory entities type index created');
    });
    
    db.run(`CREATE INDEX IF NOT EXISTS idx_memory_entities_name_search 
            ON memory_entities (user_id, entity_name COLLATE NOCASE)`, (err) => {
      if (err) console.error('Error creating memory_entities name index:', err);
      else console.log('✓ Memory entities name search index created');
    });
    
    db.run(`CREATE INDEX IF NOT EXISTS idx_memory_entities_updated 
            ON memory_entities (user_id, updated_at DESC)`, (err) => {
      if (err) console.error('Error creating memory_entities updated index:', err);
      else console.log('✓ Memory entities updated time index created');
    });

    // Memory relations indexes  
    db.run(`CREATE INDEX IF NOT EXISTS idx_memory_relations_from_entity 
            ON memory_relations (user_id, from_entity)`, (err) => {
      if (err) console.error('Error creating memory_relations from index:', err);
      else console.log('✓ Memory relations from_entity index created');
    });
    
    db.run(`CREATE INDEX IF NOT EXISTS idx_memory_relations_to_entity 
            ON memory_relations (user_id, to_entity)`, (err) => {
      if (err) console.error('Error creating memory_relations to index:', err);
      else console.log('✓ Memory relations to_entity index created');
    });
    
    db.run(`CREATE INDEX IF NOT EXISTS idx_memory_relations_type_strength 
            ON memory_relations (user_id, relation_type, strength DESC)`, (err) => {
      if (err) console.error('Error creating memory_relations type index:', err);
      else console.log('✓ Memory relations type/strength index created');
    });

    // Conversations indexes for better memory context
    db.run(`CREATE INDEX IF NOT EXISTS idx_conversations_user_module 
            ON conversations (user_id, module_context, created_at DESC)`, (err) => {
      if (err) console.error('Error creating conversations module index:', err);
      else console.log('✓ Conversations module context index created');
    });

    // Learning progress indexes
    db.run(`CREATE INDEX IF NOT EXISTS idx_learning_progress_user_module 
            ON learning_progress (user_id, module_id, last_interaction DESC)`, (err) => {
      if (err) console.error('Error creating learning_progress index:', err);
      else console.log('✓ Learning progress index created');
    });

    // Create memory analytics view for monitoring
    console.log('📈 Creating memory analytics views...');
    
    db.run(`CREATE VIEW IF NOT EXISTS memory_analytics AS
            SELECT 
              u.id as user_id,
              u.name as user_name,
              u.grade_level,
              u.tech_comfort,
              COUNT(DISTINCT me.id) as entity_count,
              COUNT(DISTINCT mr.id) as relation_count,
              COUNT(DISTINCT c.id) as conversation_count,
              MAX(c.created_at) as last_conversation,
              AVG(lp.completion_percentage) as avg_completion,
              GROUP_CONCAT(DISTINCT me.entity_type) as entity_types,
              GROUP_CONCAT(DISTINCT mr.relation_type) as relation_types
            FROM users u
            LEFT JOIN memory_entities me ON u.id = me.user_id
            LEFT JOIN memory_relations mr ON u.id = mr.user_id  
            LEFT JOIN conversations c ON u.id = c.user_id
            LEFT JOIN learning_progress lp ON u.id = lp.user_id
            GROUP BY u.id`, (err) => {
      if (err) console.error('Error creating memory_analytics view:', err);
      else console.log('✓ Memory analytics view created');
    });

    // Create entity relationship summary view
    db.run(`CREATE VIEW IF NOT EXISTS entity_relationships AS
            SELECT 
              mr.user_id,
              mr.from_entity,
              mr.to_entity,
              mr.relation_type,
              mr.strength,
              me1.entity_type as from_type,
              me2.entity_type as to_type,
              mr.created_at
            FROM memory_relations mr
            LEFT JOIN memory_entities me1 ON mr.user_id = me1.user_id AND mr.from_entity = me1.entity_name
            LEFT JOIN memory_entities me2 ON mr.user_id = me2.user_id AND mr.to_entity = me2.entity_name
            ORDER BY mr.strength DESC`, (err) => {
      if (err) console.error('Error creating entity_relationships view:', err);
      else console.log('✓ Entity relationships view created');
    });

    // Add memory quality analysis function
    console.log('🧠 Adding memory quality monitoring...');
    
    // Create a trigger to update entity timestamps when observations change
    db.run(`CREATE TRIGGER IF NOT EXISTS update_entity_timestamp 
            AFTER UPDATE OF observations ON memory_entities
            BEGIN
              UPDATE memory_entities 
              SET updated_at = CURRENT_TIMESTAMP 
              WHERE id = NEW.id;
            END`, (err) => {
      if (err) console.error('Error creating timestamp trigger:', err);
      else console.log('✓ Entity timestamp update trigger created');
    });

    console.log('\n🎉 Database enhancements complete!');
    console.log('\n📋 New features available:');
    console.log('   • Enhanced indexes for faster memory queries');
    console.log('   • Memory analytics view for monitoring user engagement');
    console.log('   • Entity relationships view for debugging memory connections');
    console.log('   • Automatic timestamp updates for entity changes');
    console.log('\n💡 Use these SQL queries to monitor memory system:');
    console.log('   SELECT * FROM memory_analytics;');
    console.log('   SELECT * FROM entity_relationships WHERE user_id = ?;');
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

// Research Logging Database Setup
function setupResearchLogging() {
  const dbPath = path.join(__dirname, 'learning_buddy.db');
  const db = new sqlite3.Database(dbPath);

  console.log('🔬 Setting up research logging tables for doctoral research...');

  db.serialize(() => {
    // Research logs table for comprehensive interaction tracking
    db.run(`
      CREATE TABLE IF NOT EXISTS research_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_message TEXT NOT NULL,
        ai_response TEXT NOT NULL,
        memory_updates TEXT DEFAULT '[]',
        progress_update TEXT DEFAULT '{}',
        session_id TEXT,
        user_agent TEXT,
        message_length INTEGER,
        response_length INTEGER,
        memory_update_count INTEGER DEFAULT 0,
        interaction_sequence INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error('Error creating research_logs table:', err);
      else console.log('✓ Research logs table created');
    });

    // Memory evolution tracking table
    db.run(`
      CREATE TABLE IF NOT EXISTS memory_evolution (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        entity_name TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        change_type TEXT NOT NULL, -- 'created', 'updated', 'relationship_added'
        change_details TEXT,
        confidence_score REAL DEFAULT 0.5,
        triggered_by TEXT, -- message that triggered this change
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error('Error creating memory_evolution table:', err);
      else console.log('✓ Memory evolution table created');
    });

    // Learning analytics table for patterns
    db.run(`
      CREATE TABLE IF NOT EXISTS learning_analytics (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        date DATE NOT NULL,
        interaction_count INTEGER DEFAULT 0,
        avg_message_length REAL DEFAULT 0,
        memory_entities_created INTEGER DEFAULT 0,
        memory_relationships_formed INTEGER DEFAULT 0,
        learning_progression_score REAL DEFAULT 0,
        engagement_level TEXT DEFAULT 'low', -- low, medium, high
        dominant_topics TEXT DEFAULT '[]',
        emotional_state_indicators TEXT DEFAULT '[]',
        implementation_intent_count INTEGER DEFAULT 0,
        breakthrough_moments INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(user_id, date)
      )
    `, (err) => {
      if (err) console.error('Error creating learning_analytics table:', err);
      else console.log('✓ Learning analytics table created');
    });

    // Primer behavior analysis table
    db.run(`
      CREATE TABLE IF NOT EXISTS primer_analysis (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        analysis_date DATE NOT NULL,
        adaptive_personality_score REAL DEFAULT 0,
        memory_context_richness REAL DEFAULT 0,
        learning_companion_effectiveness REAL DEFAULT 0,
        teaching_context_understanding REAL DEFAULT 0,
        relationship_building_score REAL DEFAULT 0,
        primer_like_behaviors TEXT DEFAULT '[]',
        improvement_recommendations TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(user_id, analysis_date)
      )
    `, (err) => {
      if (err) console.error('Error creating primer_analysis table:', err);
      else console.log('✓ Primer analysis table created');
    });

    // Research indexes for performance
    db.run('CREATE INDEX IF NOT EXISTS idx_research_logs_user_time ON research_logs (user_id, timestamp DESC)', (err) => {
      if (err) console.error('Error creating research logs index:', err);
      else console.log('✓ Research logs index created');
    });

    db.run('CREATE INDEX IF NOT EXISTS idx_memory_evolution_user_time ON memory_evolution (user_id, timestamp DESC)', (err) => {
      if (err) console.error('Error creating memory evolution index:', err);
      else console.log('✓ Memory evolution index created');
    });

    db.run('CREATE INDEX IF NOT EXISTS idx_learning_analytics_user_date ON learning_analytics (user_id, date DESC)', (err) => {
      if (err) console.error('Error creating learning analytics index:', err);
      else console.log('✓ Learning analytics index created');
    });

    // Research analytics views
    db.run(`CREATE VIEW IF NOT EXISTS user_research_summary AS
            SELECT 
              u.id as user_id,
              u.name,
              u.email,
              u.grade_level,
              u.tech_comfort,
              COUNT(DISTINCT rl.id) as total_interactions,
              COUNT(DISTINCT DATE(rl.timestamp)) as active_days,
              AVG(rl.message_length) as avg_message_length,
              AVG(rl.memory_update_count) as avg_memory_updates,
              MAX(rl.timestamp) as last_interaction,
              COUNT(DISTINCT me.id) as total_memory_entities,
              COUNT(DISTINCT mr.id) as total_memory_relations
            FROM users u
            LEFT JOIN research_logs rl ON u.id = rl.user_id
            LEFT JOIN memory_entities me ON u.id = me.user_id
            LEFT JOIN memory_relations mr ON u.id = mr.user_id
            GROUP BY u.id`, (err) => {
      if (err) console.error('Error creating user research summary view:', err);
      else console.log('✓ User research summary view created');
    });

    console.log('\n🎉 Research logging setup complete!');
    console.log('\n📊 Available research endpoints:');
    console.log('   • POST /api/research/log-interaction - Automatic interaction logging');
    console.log('   • GET /api/research/analytics - Comprehensive research analytics');
    console.log('   • Research data stored in: research_logs, memory_evolution, learning_analytics');
    console.log('\n🔬 Research queries you can run:');
    console.log('   SELECT * FROM user_research_summary;');
    console.log('   SELECT * FROM research_logs WHERE user_id = ? ORDER BY timestamp DESC;');
    console.log('   SELECT * FROM memory_evolution WHERE user_id = ? ORDER BY timestamp DESC;');
  });

  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Research logging database setup complete.');
    }
  });
}

// Memory quality assessment function
function assessMemoryQuality(userId, db) {
  return new Promise((resolve, reject) => {
    const analysis = {
      userId: userId,
      timestamp: new Date().toISOString(),
      metrics: {}
    };

    // Count entities by type
    db.get(`SELECT 
              COUNT(*) as total_entities,
              COUNT(DISTINCT entity_type) as entity_types,
              AVG(json_array_length(observations)) as avg_observations_per_entity
            FROM memory_entities 
            WHERE user_id = ?`, [userId], (err, entityStats) => {
      if (err) return reject(err);
      
      analysis.metrics.entities = entityStats;

      // Count relations by type  
      db.get(`SELECT 
                COUNT(*) as total_relations,
                COUNT(DISTINCT relation_type) as relation_types,
                AVG(strength) as avg_relation_strength
              FROM memory_relations 
              WHERE user_id = ?`, [userId], (err, relationStats) => {
        if (err) return reject(err);
        
        analysis.metrics.relations = relationStats;

        // Get conversation count
        db.get(`SELECT COUNT(*) as conversation_count 
                FROM conversations WHERE user_id = ?`, [userId], (err, convStats) => {
          if (err) return reject(err);
          
          analysis.metrics.conversations = convStats;

          // Calculate memory richness score
          const entities = entityStats.total_entities || 0;
          const relations = relationStats.total_relations || 0;
          const conversations = convStats.conversation_count || 0;
          const avgObs = entityStats.avg_observations_per_entity || 0;
          const avgStrength = relationStats.avg_relation_strength || 0;

          analysis.metrics.richness_score = Math.min(100, 
            (entities * 2) + 
            (relations * 3) + 
            (conversations * 1) + 
            (avgObs * 10) + 
            (avgStrength * 20)
          );

          analysis.metrics.quality_assessment = {
            memory_depth: avgObs >= 3 ? 'Good' : avgObs >= 2 ? 'Fair' : 'Poor',
            relationship_strength: avgStrength >= 0.7 ? 'Strong' : avgStrength >= 0.5 ? 'Moderate' : 'Weak',
            memory_coverage: entities >= 10 ? 'Rich' : entities >= 5 ? 'Adequate' : 'Limited',
            engagement_level: conversations >= 10 ? 'High' : conversations >= 5 ? 'Moderate' : 'Low'
          };

          resolve(analysis);
        });
      });
    });
  });
}

// Daily analytics aggregation function
function aggregateDailyAnalytics(userId, date) {
  const dbPath = path.join(__dirname, 'learning_buddy.db');
  const db = new sqlite3.Database(dbPath);

  return new Promise((resolve, reject) => {
    // Aggregate daily learning analytics
    db.get(`SELECT 
              COUNT(*) as interaction_count,
              AVG(message_length) as avg_message_length,
              SUM(memory_update_count) as memory_updates_total,
              GROUP_CONCAT(DISTINCT 
                CASE 
                  WHEN user_message LIKE '%excited%' OR user_message LIKE '%love%' THEN 'positive'
                  WHEN user_message LIKE '%frustrated%' OR user_message LIKE '%struggling%' THEN 'challenged'
                  WHEN user_message LIKE '%understand%' OR user_message LIKE '%makes sense%' THEN 'breakthrough'
                  ELSE NULL 
                END
              ) as emotional_indicators,
              SUM(CASE WHEN user_message LIKE '%try this%' OR user_message LIKE '%implement%' OR user_message LIKE '%use in my class%' THEN 1 ELSE 0 END) as implementation_intent,
              SUM(CASE WHEN user_message LIKE '%now i understand%' OR user_message LIKE '%makes sense%' OR user_message LIKE '%i see how%' THEN 1 ELSE 0 END) as breakthrough_moments
            FROM research_logs 
            WHERE user_id = ? AND DATE(timestamp) = ?`, [userId, date], (err, stats) => {
      if (err) return reject(err);

      // Insert or update daily analytics
      const analyticsId = require('uuid').v4();
      db.run(`INSERT OR REPLACE INTO learning_analytics 
              (id, user_id, date, interaction_count, avg_message_length, 
               memory_entities_created, implementation_intent_count, breakthrough_moments,
               emotional_state_indicators, engagement_level) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [analyticsId, userId, date, stats.interaction_count, stats.avg_message_length,
         stats.memory_updates_total, stats.implementation_intent, stats.breakthrough_moments,
         JSON.stringify(stats.emotional_indicators?.split(',').filter(Boolean) || []),
         stats.interaction_count > 10 ? 'high' : stats.interaction_count > 5 ? 'medium' : 'low'],
        (insertErr) => {
          if (insertErr) return reject(insertErr);
          resolve(stats);
        });
    });
  });
}

// Data migration helper for existing users
function migrateExistingData() {
  const dbPath = path.join(__dirname, 'learning_buddy.db');
  const db = new sqlite3.Database(dbPath);

  console.log('🔄 Migrating existing conversation data to enhanced memory format...');

  db.serialize(() => {
    // Find users with conversations but minimal memory entities
    db.all(`SELECT DISTINCT u.id, u.name, u.grade_level, u.subjects, u.tech_comfort
            FROM users u
            JOIN conversations c ON u.id = c.user_id
            LEFT JOIN memory_entities me ON u.id = me.user_id
            GROUP BY u.id
            HAVING COUNT(c.id) > 0 AND COUNT(me.id) < 5`, (err, users) => {
      if (err) {
        console.error('Error finding users for migration:', err);
        return;
      }

      console.log(`Found ${users.length} users who could benefit from memory migration`);

      users.forEach(user => {
        console.log(`📝 Analyzing conversations for user: ${user.name}`);
        
        // Get their recent conversations for analysis
        db.all(`SELECT messages FROM conversations 
                WHERE user_id = ? 
                ORDER BY created_at DESC LIMIT 10`, [user.id], (err, conversations) => {
          if (err) {
            console.error(`Error getting conversations for ${user.name}:`, err);
            return;
          }

          // Extract common concepts from their conversations
          const concepts = new Set();
          conversations.forEach(conv => {
            try {
              const messages = JSON.parse(conv.messages || '[]');
              messages.forEach(msg => {
                if (msg.role === 'user') {
                  // Simple concept extraction
                  const text = msg.content.toLowerCase();
                  if (text.includes('student')) concepts.add('student_engagement');
                  if (text.includes('classroom')) concepts.add('classroom_management');
                  if (text.includes('lesson')) concepts.add('lesson_planning');
                  if (text.includes('assessment')) concepts.add('assessment_strategies');
                  if (text.includes('ai') || text.includes('artificial intelligence')) concepts.add('ai_understanding');
                  if (text.includes('tool')) concepts.add('ai_tools');
                  if (text.includes('worry') || text.includes('concern')) concepts.add('ai_concerns');
                }
              });
            } catch (e) {
              console.warn(`Failed to parse conversation for ${user.name}`);
            }
          });

          // Create memory entities for discovered concepts
          concepts.forEach(concept => {
            const entityId = require('uuid').v4();
            db.run(`INSERT OR IGNORE INTO memory_entities 
                    (id, user_id, entity_name, entity_type, observations) 
                    VALUES (?, ?, ?, ?, ?)`, 
                   [entityId, user.id, concept, 'migrated_concept', 
                    JSON.stringify([`Concept identified during data migration on ${new Date().toLocaleDateString()}`])],
                   (err) => {
                     if (err) console.error(`Error creating entity ${concept} for ${user.name}:`, err);
                   });
          });

          if (concepts.size > 0) {
            console.log(`✓ Created ${concepts.size} memory entities for ${user.name}`);
          }
        });
      });
    });
  });

  db.close();
}

// Run enhancement if called directly
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'migrate') {
    migrateExistingData();
  } else if (command === 'research') {
    setupResearchLogging();
  } else {
    enhanceDatabase();
  }
}

module.exports = { 
  enhanceDatabase, 
  setupResearchLogging,
  assessMemoryQuality, 
  aggregateDailyAnalytics,
  migrateExistingData 
};