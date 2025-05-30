const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

class MemoryService {
  constructor(dbPath) {
    this.db = new sqlite3.Database(dbPath);
  }

  // Create a new memory entity
  async createEntity(userId, entityName, entityType, observations = []) {
    return new Promise((resolve, reject) => {
      const entityId = uuidv4();
      const observationsJson = JSON.stringify(observations);
      
      this.db.run(
        `INSERT INTO memory_entities (id, user_id, entity_name, entity_type, observations) 
         VALUES (?, ?, ?, ?, ?)`,
        [entityId, userId, entityName, entityType, observationsJson],
        function(err) {
          if (err) reject(err);
          else resolve({ id: entityId, entityName, entityType, observations });
        }
      );
    });
  }

  // Add observations to existing entity
  async addObservations(userId, entityName, newObservations) {
    return new Promise((resolve, reject) => {
      // First, get existing entity
      this.db.get(
        'SELECT * FROM memory_entities WHERE user_id = ? AND entity_name = ?',
        [userId, entityName],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }

          if (row) {
            // Update existing entity
            const existingObservations = JSON.parse(row.observations || '[]');
            const updatedObservations = [...existingObservations, ...newObservations];
            const observationsJson = JSON.stringify(updatedObservations);

            this.db.run(
              'UPDATE memory_entities SET observations = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
              [observationsJson, row.id],
              (updateErr) => {
                if (updateErr) reject(updateErr);
                else resolve({ id: row.id, observations: updatedObservations });
              }
            );
          } else {
            // Create new entity
            this.createEntity(userId, entityName, 'concept', newObservations)
              .then(resolve)
              .catch(reject);
          }
        }
      );
    });
  }

  // Create or update a relationship
  async createRelation(userId, fromEntity, toEntity, relationType, strength = 0.5) {
    return new Promise((resolve, reject) => {
      const relationId = uuidv4();
      
      this.db.run(
        `INSERT OR REPLACE INTO memory_relations 
         (id, user_id, from_entity, to_entity, relation_type, strength) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [relationId, userId, fromEntity, toEntity, relationType, strength],
        function(err) {
          if (err) reject(err);
          else resolve({ id: relationId, fromEntity, toEntity, relationType, strength });
        }
      );
    });
  }

  // Get user's memory entities by type or name
  async getEntities(userId, entityType = null, entityName = null) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM memory_entities WHERE user_id = ?';
      let params = [userId];

      if (entityType) {
        query += ' AND entity_type = ?';
        params.push(entityType);
      }

      if (entityName) {
        query += ' AND entity_name LIKE ?';
        params.push(`%${entityName}%`);
      }

      query += ' ORDER BY updated_at DESC';

      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const entities = rows.map(row => ({
            ...row,
            observations: JSON.parse(row.observations || '[]')
          }));
          resolve(entities);
        }
      });
    });
  }

  // Get relationships for an entity
  async getRelations(userId, entityName = null) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM memory_relations WHERE user_id = ?';
      let params = [userId];

      if (entityName) {
        query += ' AND (from_entity = ? OR to_entity = ?)';
        params.push(entityName, entityName);
      }

      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const relations = rows.map(row => ({
            ...row,
            evidence: JSON.parse(row.evidence || '[]')
          }));
          resolve(relations);
        }
      });
    });
  }

  // Build memory context for AI prompt
  async buildMemoryContext(userId, currentTopic = null) {
    try {
      const entities = await this.getEntities(userId);
      const relations = await this.getRelations(userId);

      // Filter relevant entities if topic is provided
      let relevantEntities = entities;
      if (currentTopic) {
        relevantEntities = entities.filter(entity => 
          entity.entity_name.toLowerCase().includes(currentTopic.toLowerCase()) ||
          entity.observations.some(obs => 
            obs.toLowerCase().includes(currentTopic.toLowerCase())
          )
        );
      }

      // Build context string
      let context = "Here's what I remember about this teacher:\n\n";
      
      if (relevantEntities.length > 0) {
        context += "Key topics and concepts:\n";
        relevantEntities.slice(0, 10).forEach(entity => {
          context += `- ${entity.entity_name} (${entity.entity_type}): ${entity.observations.slice(-2).join('; ')}\n`;
        });
      }

      if (relations.length > 0) {
        context += "\nLearning relationships:\n";
        relations.slice(0, 5).forEach(relation => {
          context += `- ${relation.from_entity} ${relation.relation_type} ${relation.to_entity}\n`;
        });
      }

      return context;
    } catch (error) {
      console.error('Error building memory context:', error);
      return "This is our first conversation.";
    }
  }

  // Update memory from conversation
  async updateFromConversation(userId, userMessage, aiResponse, currentTopic) {
    try {
      const updates = [];

      // Extract key concepts from the conversation
      const concepts = this.extractConcepts(userMessage + ' ' + aiResponse);
      
      for (const concept of concepts) {
        const observation = `Discussed ${concept} on ${new Date().toLocaleDateString()}`;
        await this.addObservations(userId, concept, [observation]);
        updates.push(`Updated knowledge about: ${concept}`);
      }

      // Detect learning patterns
      if (userMessage.toLowerCase().includes('confused') || userMessage.toLowerCase().includes("don't understand")) {
        await this.createRelation(userId, 'user', currentTopic || 'current_topic', 'struggles_with', 0.8);
        updates.push(`Noted difficulty with: ${currentTopic}`);
      }

      if (userMessage.toLowerCase().includes('got it') || userMessage.toLowerCase().includes('understand now')) {
        await this.createRelation(userId, 'user', currentTopic || 'current_topic', 'understands', 0.8);
        updates.push(`Noted understanding of: ${currentTopic}`);
      }

      return updates;
    } catch (error) {
      console.error('Error updating memory from conversation:', error);
      return [];
    }
  }

  // Simple concept extraction (can be enhanced with NLP)
  extractConcepts(text) {
    const aiConcepts = [
      'artificial intelligence', 'ai', 'machine learning', 'prompt engineering', 
      'chatgpt', 'large language model', 'llm', 'neural network', 'training data',
      'bias', 'ethics', 'automation', 'generative ai', 'natural language processing'
    ];
    
    const foundConcepts = [];
    const lowerText = text.toLowerCase();
    
    for (const concept of aiConcepts) {
      if (lowerText.includes(concept)) {
        foundConcepts.push(concept);
      }
    }
    
    return [...new Set(foundConcepts)]; // Remove duplicates
  }

  // Get recent conversation history
  async getRecentConversations(userId, limit = 5) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM conversations WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
        [userId, limit],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            const conversations = rows.map(row => {
              let messages;
              try {
                // Handle both string and object cases for messages
                if (typeof row.messages === 'string') {
                  messages = JSON.parse(row.messages);
                } else {
                  messages = row.messages || [];
                }
              } catch (parseError) {
                console.warn('Failed to parse messages for conversation', row.id, parseError);
                messages = [];
              }
              
              return {
                ...row,
                messages: Array.isArray(messages) ? messages : []
              };
            });
            resolve(conversations);
          }
        }
      );
    });
  }
}

module.exports = MemoryService;
