// Enhanced Memory Service with improved context building and learning
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const { updateMemoryWithPrimerIntelligence } = require('./primer-enhancements');

class EnhancedMemoryService {
  constructor(dbPath) {
    this.db = new sqlite3.Database(dbPath);
  }

  // Enhanced memory context building with semantic clustering
  async buildMemoryContext(userId, currentTopic = null) {
    try {
      const entities = await this.getEntities(userId);
      const relations = await this.getRelations(userId);
      const recentConversations = await this.getRecentConversations(userId, 10);

      // Build different types of memory context
      const teachingContext = this.buildTeachingContext(entities, relations);
      const learningProgress = this.buildLearningProgressContext(entities, relations);
      const conversationPatterns = this.extractConversationPatterns(recentConversations);
      const topicSpecificMemory = currentTopic ? 
        this.buildTopicSpecificContext(entities, relations, currentTopic) : null;

      let context = `## Memory Context for ${userId}\n\n`;
      
      // Teaching Profile & Context
      if (teachingContext.length > 0) {
        context += "### Teaching Context:\n";
        teachingContext.forEach(item => {
          context += `- ${item}\n`;
        });
        context += "\n";
      }

      // Learning Journey & Progress
      if (learningProgress.length > 0) {
        context += "### Learning Journey:\n";
        learningProgress.forEach(item => {
          context += `- ${item}\n`;
        });
        context += "\n";
      }

      // Conversation Patterns & Preferences
      if (conversationPatterns.length > 0) {
        context += "### Communication Patterns:\n";
        conversationPatterns.forEach(pattern => {
          context += `- ${pattern}\n`;
        });
        context += "\n";
      }

      // Current Topic Memory
      if (topicSpecificMemory && topicSpecificMemory.length > 0) {
        context += `### Memory about "${currentTopic}":\n`;
        topicSpecificMemory.forEach(item => {
          context += `- ${item}\n`;
        });
        context += "\n";
      }

      // Recent Context Summary
      const recentContext = this.buildRecentContextSummary(recentConversations);
      if (recentContext) {
        context += "### Recent Conversation Context:\n";
        context += `${recentContext}\n\n`;
      }

      return context || "This is our first meaningful conversation.";
    } catch (error) {
      console.error('Error building enhanced memory context:', error);
      return "Starting fresh conversation.";
    }
  }

  // Build teaching-specific context
  buildTeachingContext(entities, relations) {
    const teachingContext = [];
    
    // Extract teaching-related entities
    const teachingEntities = entities.filter(entity => 
      entity.entity_type === 'teaching_challenge' ||
      entity.entity_type === 'classroom_context' ||
      entity.entity_type === 'teaching_goal' ||
      entity.entity_type === 'student_need'
    );

    teachingEntities.forEach(entity => {
      const recentObservations = entity.observations.slice(-3);
      teachingContext.push(`${entity.entity_name}: ${recentObservations.join('; ')}`);
    });

    return teachingContext;
  }

  // Build learning progress context
  buildLearningProgressContext(entities, relations) {
    const progressContext = [];
    
    // Find learning-related entities and relationships
    const learningEntities = entities.filter(entity => 
      entity.entity_type === 'concept' ||
      entity.entity_type === 'skill' ||
      entity.entity_type === 'understanding'
    );

    // Group by mastery level using relations
    const masteredConcepts = [];
    const strugglingConcepts = [];
    const exploringConcepts = [];

    relations.forEach(relation => {
      if (relation.relation_type === 'understands' && relation.strength > 0.7) {
        masteredConcepts.push(relation.to_entity);
      } else if (relation.relation_type === 'struggles_with' && relation.strength > 0.6) {
        strugglingConcepts.push(relation.to_entity);
      } else if (relation.relation_type === 'exploring') {
        exploringConcepts.push(relation.to_entity);
      }
    });

    if (masteredConcepts.length > 0) {
      progressContext.push(`Confident with: ${masteredConcepts.slice(0, 5).join(', ')}`);
    }
    if (strugglingConcepts.length > 0) {
      progressContext.push(`Needs support with: ${strugglingConcepts.slice(0, 3).join(', ')}`);
    }
    if (exploringConcepts.length > 0) {
      progressContext.push(`Currently exploring: ${exploringConcepts.slice(0, 3).join(', ')}`);
    }

    return progressContext;
  }

  // Extract conversation patterns for personalization
  extractConversationPatterns(conversations) {
    const patterns = [];
    
    if (conversations.length < 3) return patterns;

    // Analyze message lengths, question patterns, engagement style
    let totalMessages = 0;
    let questionCount = 0;
    let shortMessageCount = 0;
    let detailedMessageCount = 0;

    conversations.forEach(conv => {
      const messages = Array.isArray(conv.messages) ? conv.messages : 
        (typeof conv.messages === 'string' ? JSON.parse(conv.messages || '[]') : []);
      
      messages.filter(msg => msg.role === 'user').forEach(msg => {
        totalMessages++;
        if (msg.content.includes('?')) questionCount++;
        if (msg.content.length < 50) shortMessageCount++;
        if (msg.content.length > 200) detailedMessageCount++;
      });
    });

    if (totalMessages > 0) {
      const questionRatio = questionCount / totalMessages;
      const shortMessageRatio = shortMessageCount / totalMessages;
      const detailedRatio = detailedMessageCount / totalMessages;

      if (questionRatio > 0.5) {
        patterns.push("Prefers asking questions to explore concepts");
      }
      if (shortMessageRatio > 0.6) {
        patterns.push("Communication style: concise, direct responses");
      } else if (detailedRatio > 0.3) {
        patterns.push("Communication style: detailed, thoughtful explanations");
      }
    }

    return patterns;
  }

  // Build topic-specific memory
  buildTopicSpecificContext(entities, relations, topic) {
    const topicMemory = [];
    
    // Find entities related to current topic
    const relevantEntities = entities.filter(entity => 
      entity.entity_name.toLowerCase().includes(topic.toLowerCase()) ||
      entity.observations.some(obs => 
        obs.toLowerCase().includes(topic.toLowerCase())
      )
    );

    relevantEntities.forEach(entity => {
      const contextualObs = entity.observations.filter(obs => 
        obs.toLowerCase().includes(topic.toLowerCase())
      );
      if (contextualObs.length > 0) {
        topicMemory.push(`${entity.entity_name}: ${contextualObs.slice(-2).join('; ')}`);
      }
    });

    return topicMemory;
  }

  // Build recent context summary
  buildRecentContextSummary(conversations) {
    if (conversations.length === 0) return null;

    const recentConv = conversations[0];
    const messages = Array.isArray(recentConv.messages) ? recentConv.messages : 
      (typeof recentConv.messages === 'string' ? JSON.parse(recentConv.messages || '[]') : []);
    
    const lastUserMessage = messages.filter(msg => msg.role === 'user').slice(-1)[0];
    const lastAIMessage = messages.filter(msg => msg.role === 'assistant').slice(-1)[0];

    if (lastUserMessage && lastAIMessage) {
      return `Last discussion: User asked about "${lastUserMessage.content.substring(0, 100)}..." and we covered ${lastAIMessage.content.substring(0, 150)}...`;
    }

    return null;
  }

  // Enhanced concept extraction using semantic analysis
  extractConcepts(text, userContext = {}) {
    const concepts = [];
    const lowerText = text.toLowerCase();
    
    // AI & Technology concepts
    const aiConcepts = [
      'artificial intelligence', 'ai', 'machine learning', 'prompt engineering', 
      'chatgpt', 'large language model', 'llm', 'neural network', 'training data',
      'bias', 'ethics', 'automation', 'generative ai', 'natural language processing',
      'deep learning', 'algorithm', 'data', 'privacy', 'security'
    ];
    
    // Teaching & Pedagogy concepts
    const teachingConcepts = [
      'classroom management', 'lesson planning', 'assessment', 'differentiation',
      'student engagement', 'learning objectives', 'curriculum', 'standards',
      'formative assessment', 'summative assessment', 'scaffolding', 'feedback',
      'collaboration', 'critical thinking', 'creativity', 'problem solving'
    ];
    
    // Grade level specific concerns
    const gradeConcepts = {
      'elementary': ['play-based learning', 'hands-on activities', 'visual learning'],
      'middle school': ['project-based learning', 'peer collaboration', 'identity development'],
      'high school': ['college prep', 'career readiness', 'independent learning']
    };

    // Extract AI concepts
    aiConcepts.forEach(concept => {
      if (lowerText.includes(concept)) {
        concepts.push({ name: concept, type: 'ai_concept', confidence: 0.9 });
      }
    });

    // Extract teaching concepts  
    teachingConcepts.forEach(concept => {
      if (lowerText.includes(concept)) {
        concepts.push({ name: concept, type: 'teaching_concept', confidence: 0.8 });
      }
    });

    // Extract grade-specific concepts
    if (userContext.gradeLevel && gradeConcepts[userContext.gradeLevel]) {
      gradeConcepts[userContext.gradeLevel].forEach(concept => {
        if (lowerText.includes(concept)) {
          concepts.push({ name: concept, type: 'grade_specific', confidence: 0.7 });
        }
      });
    }

    // Extract questions and concerns (emotional/learning state)
    if (lowerText.includes('worried') || lowerText.includes('concerned') || lowerText.includes('afraid')) {
      concepts.push({ name: 'concerns about AI', type: 'emotional_state', confidence: 0.8 });
    }
    if (lowerText.includes('excited') || lowerText.includes('interested') || lowerText.includes('curious')) {
      concepts.push({ name: 'enthusiasm for AI', type: 'emotional_state', confidence: 0.8 });
    }
    if (lowerText.includes('confused') || lowerText.includes("don't understand")) {
      concepts.push({ name: 'confusion', type: 'learning_state', confidence: 0.9 });
    }

    return concepts;
  }

  // Enhanced memory updates using Primer-like intelligence
  async updateFromConversation(userId, userMessage, aiResponse, currentTopic, userProfile = {}) {
    try {
      // Use Primer-like intelligence for memory updates
      const primerUpdates = await updateMemoryWithPrimerIntelligence(
        this, userId, userMessage, aiResponse, currentTopic, userProfile
      );
      
      // Return Primer updates if successful, otherwise fallback to basic
      if (primerUpdates.length > 0) {
        return primerUpdates;
      }
      
      // Basic fallback memory updates
      const updates = [];
      const concepts = this.extractConcepts(userMessage + ' ' + aiResponse, userProfile);
      
      for (const concept of concepts) {
        const observation = `Discussed: ${concept.name} on ${new Date().toLocaleDateString()}`;
        await this.addObservations(userId, concept.name, [observation]);
        updates.push(`Learning about: ${concept.name}`);
      }

      return updates;
    } catch (error) {
      console.error('Error updating enhanced memory:', error);
      return ['Memory system processing this interaction'];
    }
  }

  // Analyze learning progression from conversation
  analyzeProgressionFromText(userMessage, aiResponse) {
    const progressions = [];
    const combined = (userMessage + ' ' + aiResponse).toLowerCase();
    
    // Advanced progression indicators
    const progressPatterns = [
      { pattern: /(now i understand|makes sense now|i get it now)/, relation: 'understands', strength: 0.8, description: 'achieved understanding' },
      { pattern: /(still confused|still don't get|still unclear)/, relation: 'struggles_with', strength: 0.7, description: 'continued struggle' },
      { pattern: /(want to learn more|tell me more|can you explain)/, relation: 'interested_in', strength: 0.6, description: 'showing interest' },
      { pattern: /(this is helpful|that helps|good explanation)/, relation: 'finding_helpful', strength: 0.7, description: 'positive feedback' },
      { pattern: /(tried this|implemented|used in class)/, relation: 'applied', strength: 0.9, description: 'practical application' }
    ];

    progressPatterns.forEach(pattern => {
      if (pattern.pattern.test(combined)) {
        // Extract the concept being discussed (simplified - could be enhanced with NLP)
        const words = combined.split(' ');
        const conceptIndex = words.findIndex(word => 
          ['ai', 'chatgpt', 'prompt', 'machine learning', 'algorithm'].includes(word)
        );
        
        if (conceptIndex !== -1) {
          progressions.push({
            concept: words[conceptIndex],
            relation: pattern.relation,
            strength: pattern.strength,
            description: pattern.description
          });
        }
      }
    });

    return progressions;
  }

  // Extract teaching context from conversation
  extractTeachingContext(message, userProfile) {
    const contexts = [];
    const lowerMessage = message.toLowerCase();
    
    // Classroom challenges
    if (lowerMessage.includes('my students') || lowerMessage.includes('in my class')) {
      if (lowerMessage.includes('struggle') || lowerMessage.includes('difficult')) {
        contexts.push({
          name: 'student_learning_challenges',
          type: 'teaching_challenge',
          observation: `Mentioned student challenges: ${message.substring(0, 100)}...`
        });
      }
    }

    // Subject-specific context
    if (userProfile.subjects && Array.isArray(userProfile.subjects)) {
      userProfile.subjects.forEach(subject => {
        if (lowerMessage.includes(subject.toLowerCase())) {
          contexts.push({
            name: `${subject}_teaching`,
            type: 'subject_context',
            observation: `Discussed ${subject} teaching: ${message.substring(0, 100)}...`
          });
        }
      });
    }

    return contexts;
  }

  // All existing methods remain the same...
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

  async addObservations(userId, entityName, newObservations) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM memory_entities WHERE user_id = ? AND entity_name = ?',
        [userId, entityName],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }

          if (row) {
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
            this.createEntity(userId, entityName, 'concept', newObservations)
              .then(resolve)
              .catch(reject);
          }
        }
      );
    });
  }

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

module.exports = EnhancedMemoryService;