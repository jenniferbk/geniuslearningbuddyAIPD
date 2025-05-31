// Semantic Memory Service with sentence-transformers integration
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const { pipeline } = require('@xenova/transformers');
const similarity = require('similarity');
const _ = require('lodash');
const { updateMemoryWithPrimerIntelligence } = require('./primer-enhancements');

class SemanticMemoryService {
  constructor(dbPath) {
    this.db = new sqlite3.Database(dbPath);
    this.embedder = null;
    this.initialized = false;
    
    // Educational domain concept seeds for semantic clustering
    this.educationalSeeds = {
      'ai_concepts': [
        'artificial intelligence machine learning deep learning neural networks',
        'chatgpt large language models generative ai automation',
        'prompt engineering bias ethics privacy security training data'
      ],
      'teaching_concepts': [
        'classroom management lesson planning curriculum assessment differentiation',
        'student engagement learning objectives scaffolding feedback collaboration',
        'critical thinking creativity problem solving formative summative evaluation'
      ],
      'learning_states': [
        'confusion understanding mastery struggle progress achievement',
        'curiosity interest enthusiasm motivation engagement frustration',
        'exploration discovery practice application synthesis evaluation'
      ],
      'teaching_challenges': [
        'student behavior classroom disruption time management workload',
        'technology integration digital divide resource limitations',
        'parent communication administrative burden professional development'
      ]
    };
    
    this.initializeEmbedder();
  }

  // Initialize the sentence transformer model
  async initializeEmbedder() {
    try {
      console.log('Initializing semantic embedder...');
      this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      this.initialized = true;
      console.log('Semantic embedder ready!');
    } catch (error) {
      console.error('Failed to initialize embedder:', error);
      console.log('Falling back to keyword matching...');
      this.initialized = false;
    }
  }

  // Wait for embedder initialization
  async ensureInitialized() {
    if (!this.initialized && this.embedder === null) {
      await this.initializeEmbedder();
    }
    return this.initialized;
  }

  // Generate embeddings for text
  async generateEmbedding(text) {
    if (!await this.ensureInitialized()) {
      return null;
    }
    
    try {
      const output = await this.embedder(text);
      // Convert to regular array and flatten if needed
      return Array.from(output.data);
    } catch (error) {
      console.error('Error generating embedding:', error);
      return null;
    }
  }

  // Calculate semantic similarity between two texts
  async calculateSimilarity(text1, text2) {
    const [embedding1, embedding2] = await Promise.all([
      this.generateEmbedding(text1),
      this.generateEmbedding(text2)
    ]);
    
    if (!embedding1 || !embedding2) {
      return 0;
    }
    
    return this.cosineSimilarity(embedding1, embedding2);
  }

  // Cosine similarity calculation
  cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < Math.min(vecA.length, vecB.length); i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // ENHANCED: Semantic concept extraction with educational domain awareness
  async extractConceptsWithEmbeddings(text, userContext = {}) {
    const concepts = [];
    
    if (!await this.ensureInitialized()) {
      // Fallback to keyword matching
      return this.extractConceptsKeywordFallback(text, userContext);
    }

    try {
      const textEmbedding = await this.generateEmbedding(text);
      if (!textEmbedding) {
        return this.extractConceptsKeywordFallback(text, userContext);
      }

      // Semantic matching against educational domain seeds
      for (const [domain, seedTexts] of Object.entries(this.educationalSeeds)) {
        for (const seedText of seedTexts) {
          const similarity = await this.calculateSimilarity(text, seedText);
          
          if (similarity > 0.3) { // Semantic similarity threshold
            // Extract specific concepts from the seed that are semantically similar
            const specificConcepts = await this.extractSpecificConcepts(text, seedText, similarity);
            specificConcepts.forEach(concept => {
              concepts.push({
                name: concept,
                type: domain,
                confidence: similarity,
                method: 'semantic'
              });
            });
          }
        }
      }

      // Emotional and learning state detection with context
      const emotionalConcepts = await this.detectEmotionalStates(text, userContext);
      concepts.push(...emotionalConcepts);

      // Remove duplicates and sort by confidence
      const uniqueConcepts = _.uniqBy(concepts, 'name');
      return _.orderBy(uniqueConcepts, 'confidence', 'desc');

    } catch (error) {
      console.error('Error in semantic concept extraction:', error);
      return this.extractConceptsKeywordFallback(text, userContext);
    }
  }

  // Extract specific concepts from semantically similar text
  async extractSpecificConcepts(inputText, seedText, similarity) {
    const concepts = [];
    const inputWords = inputText.toLowerCase().split(/\s+/);
    const seedWords = seedText.toLowerCase().split(/\s+/);
    
    // Find overlapping concepts with semantic boosting
    const commonWords = _.intersection(inputWords, seedWords);
    
    // Multi-word concept detection
    const multiWordConcepts = [
      'machine learning', 'artificial intelligence', 'lesson planning', 
      'classroom management', 'student engagement', 'critical thinking',
      'prompt engineering', 'large language model', 'formative assessment'
    ];
    
    multiWordConcepts.forEach(concept => {
      if (inputText.toLowerCase().includes(concept)) {
        concepts.push(concept);
      }
    });
    
    // Add single word concepts that appear in both
    commonWords.forEach(word => {
      if (word.length > 3 && !['that', 'with', 'from', 'they', 'this', 'have'].includes(word)) {
        concepts.push(word);
      }
    });
    
    return concepts;
  }

  // Enhanced emotional state detection
  async detectEmotionalStates(text, userContext) {
    const emotions = [];
    const lowerText = text.toLowerCase();
    
    // Semantic emotion patterns with educational context
    const emotionPatterns = [
      {
        indicators: ['worried', 'concerned', 'afraid', 'anxious', 'nervous'],
        concept: 'anxiety about AI integration',
        type: 'emotional_state',
        confidence: 0.8
      },
      {
        indicators: ['excited', 'enthusiastic', 'interested', 'curious', 'eager'],
        concept: 'enthusiasm for AI learning',
        type: 'emotional_state', 
        confidence: 0.8
      },
      {
        indicators: ['confused', 'unclear', "don't understand", 'lost', 'overwhelmed'],
        concept: 'conceptual confusion',
        type: 'learning_state',
        confidence: 0.9
      },
      {
        indicators: ['confident', 'comfortable', 'understand', 'clear', 'makes sense'],
        concept: 'conceptual mastery',
        type: 'learning_state',
        confidence: 0.8
      },
      {
        indicators: ['struggling', 'difficult', 'hard', 'challenging', 'frustrating'],
        concept: 'learning challenge',
        type: 'learning_state',
        confidence: 0.7
      }
    ];
    
    emotionPatterns.forEach(pattern => {
      const found = pattern.indicators.some(indicator => lowerText.includes(indicator));
      if (found) {
        emotions.push({
          name: pattern.concept,
          type: pattern.type,
          confidence: pattern.confidence,
          method: 'semantic_emotional'
        });
      }
    });
    
    return emotions;
  }

  // Fallback keyword extraction (maintains backwards compatibility)
  extractConceptsKeywordFallback(text, userContext = {}) {
    const concepts = [];
    const lowerText = text.toLowerCase();
    
    // Core educational concepts
    const aiConcepts = [
      'artificial intelligence', 'ai', 'machine learning', 'prompt engineering',
      'chatgpt', 'large language model', 'llm', 'neural network', 'training data',
      'bias', 'ethics', 'automation', 'generative ai', 'natural language processing'
    ];
    
    const teachingConcepts = [
      'classroom management', 'lesson planning', 'assessment', 'differentiation',
      'student engagement', 'learning objectives', 'curriculum', 'standards',
      'scaffolding', 'feedback', 'collaboration', 'critical thinking'
    ];
    
    // Extract concepts with keyword matching
    [...aiConcepts, ...teachingConcepts].forEach(concept => {
      if (lowerText.includes(concept)) {
        concepts.push({
          name: concept,
          type: aiConcepts.includes(concept) ? 'ai_concept' : 'teaching_concept',
          confidence: 0.7,
          method: 'keyword'
        });
      }
    });
    
    return concepts;
  }

  // ENHANCED: Semantic memory context building
  async buildMemoryContext(userId, currentTopic = null) {
    try {
      const entities = await this.getEntities(userId);
      const relations = await this.getRelations(userId);
      const recentConversations = await this.getRecentConversations(userId, 10);

      // Semantic clustering of memory content
      const semanticClusters = await this.buildSemanticClusters(entities, currentTopic);
      const teachingContext = this.buildTeachingContext(entities, relations);
      const learningProgress = await this.buildSemanticLearningProgress(entities, relations);
      const conversationPatterns = this.extractConversationPatterns(recentConversations);

      let context = `## Enhanced Memory Context for ${userId}\n\n`;
      
      // Semantic topic clusters
      if (semanticClusters.length > 0) {
        context += "### Key Learning Areas:\n";
        semanticClusters.forEach(cluster => {
          context += `- ${cluster.topic}: ${cluster.concepts.join(', ')}\n`;
        });
        context += "\n";
      }

      // Teaching context
      if (teachingContext.length > 0) {
        context += "### Teaching Context:\n";
        teachingContext.forEach(item => {
          context += `- ${item}\n`;
        });
        context += "\n";
      }

      // Semantic learning progression
      if (learningProgress.length > 0) {
        context += "### Learning Journey:\n";
        learningProgress.forEach(item => {
          context += `- ${item}\n`;
        });
        context += "\n";
      }

      // Communication patterns
      if (conversationPatterns.length > 0) {
        context += "### Communication Patterns:\n";
        conversationPatterns.forEach(pattern => {
          context += `- ${pattern}\n`;
        });
        context += "\n";
      }

      return context || "This is our first meaningful conversation.";
    } catch (error) {
      console.error('Error building semantic memory context:', error);
      return "Starting fresh conversation.";
    }
  }

  // Build semantic clusters of related concepts
  async buildSemanticClusters(entities, currentTopic = null) {
    const clusters = [];
    
    if (!await this.ensureInitialized()) {
      return this.buildBasicClusters(entities);
    }

    try {
      // Group entities by semantic similarity
      const conceptEntities = entities.filter(e => e.entity_type === 'concept' || e.entity_type === 'ai_concept' || e.entity_type === 'teaching_concept');
      
      const grouped = await this.groupBySemantic(conceptEntities);
      
      grouped.forEach(group => {
        if (group.concepts.length > 1) {
          clusters.push({
            topic: group.mainTopic,
            concepts: group.concepts.slice(0, 5), // Limit for readability
            strength: group.avgSimilarity
          });
        }
      });

      return _.orderBy(clusters, 'strength', 'desc');
    } catch (error) {
      console.error('Error building semantic clusters:', error);
      return this.buildBasicClusters(entities);
    }
  }

  // Group entities by semantic similarity
  async groupBySemantic(entities) {
    const groups = [];
    const processed = new Set();

    for (const entity of entities) {
      if (processed.has(entity.entity_name)) continue;

      const group = {
        mainTopic: entity.entity_name,
        concepts: [entity.entity_name],
        similarities: []
      };

      for (const other of entities) {
        if (other.entity_name === entity.entity_name || processed.has(other.entity_name)) continue;

        const similarity = await this.calculateSimilarity(entity.entity_name, other.entity_name);
        
        if (similarity > 0.4) { // Clustering threshold
          group.concepts.push(other.entity_name);
          group.similarities.push(similarity);
          processed.add(other.entity_name);
        }
      }

      if (group.concepts.length > 1) {
        group.avgSimilarity = group.similarities.reduce((a, b) => a + b, 0) / group.similarities.length;
        groups.push(group);
      }

      processed.add(entity.entity_name);
    }

    return groups;
  }

  // Fallback basic clustering
  buildBasicClusters(entities) {
    const clusters = [];
    const grouped = _.groupBy(entities, 'entity_type');
    
    Object.entries(grouped).forEach(([type, typeEntities]) => {
      if (typeEntities.length > 1) {
        clusters.push({
          topic: type.replace('_', ' '),
          concepts: typeEntities.map(e => e.entity_name).slice(0, 5),
          strength: 0.5
        });
      }
    });
    
    return clusters;
  }

  // Enhanced learning progress with semantic understanding
  async buildSemanticLearningProgress(entities, relations) {
    const progress = [];
    
    // Semantic analysis of learning states
    const learningEntities = entities.filter(entity => 
      entity.entity_type === 'concept' || 
      entity.entity_type === 'learning_state' ||
      entity.entity_type === 'ai_concept' ||
      entity.entity_type === 'teaching_concept'
    );

    // Group by mastery level with semantic understanding
    const masteredConcepts = [];
    const strugglingConcepts = [];
    const exploringConcepts = [];

    // Analyze relations for learning progression
    relations.forEach(relation => {
      if (relation.relation_type === 'understands' && relation.strength > 0.7) {
        masteredConcepts.push(relation.to_entity);
      } else if (relation.relation_type === 'struggles_with' && relation.strength > 0.6) {
        strugglingConcepts.push(relation.to_entity);
      } else if (relation.relation_type === 'exploring') {
        exploringConcepts.push(relation.to_entity);
      }
    });

    // Build semantic progress narrative
    if (masteredConcepts.length > 0) {
      progress.push(`Demonstrating confidence with: ${masteredConcepts.slice(0, 5).join(', ')}`);
    }
    if (strugglingConcepts.length > 0) {
      progress.push(`Working through challenges with: ${strugglingConcepts.slice(0, 3).join(', ')}`);
    }
    if (exploringConcepts.length > 0) {
      progress.push(`Actively exploring: ${exploringConcepts.slice(0, 3).join(', ')}`);
    }

    return progress;
  }

  // ENHANCED: Memory updates with semantic intelligence
  async updateFromConversation(userId, userMessage, aiResponse, currentTopic, userProfile = {}) {
    try {
      // Use Primer-like intelligence first
      const primerUpdates = await updateMemoryWithPrimerIntelligence(
        this, userId, userMessage, aiResponse, currentTopic, userProfile
      );
      
      if (primerUpdates.length > 0) {
        return primerUpdates;
      }
      
      // Semantic memory updates
      const updates = [];
      const concepts = await this.extractConceptsWithEmbeddings(userMessage + ' ' + aiResponse, userProfile);
      
      for (const concept of concepts) {
        const observation = `Discussed: ${concept.name} (${concept.method}, confidence: ${concept.confidence.toFixed(2)}) on ${new Date().toLocaleDateString()}`;
        await this.addObservations(userId, concept.name, [observation]);
        updates.push(`Learning about: ${concept.name}`);
        
        // Create semantic relationships
        await this.createSemanticRelationships(userId, concept, concepts, userMessage + ' ' + aiResponse);
      }

      return updates;
    } catch (error) {
      console.error('Error updating semantic memory:', error);
      return ['Memory system processing this interaction'];
    }
  }

  // Create relationships based on semantic similarity
  async createSemanticRelationships(userId, mainConcept, allConcepts, context) {
    try {
      for (const otherConcept of allConcepts) {
        if (otherConcept.name === mainConcept.name) continue;
        
        const similarity = await this.calculateSimilarity(mainConcept.name, otherConcept.name);
        
        if (similarity > 0.5) {
          await this.createRelation(
            userId, 
            mainConcept.name, 
            otherConcept.name, 
            'semantically_related', 
            similarity
          );
        }
      }
      
      // Analyze learning progression semantically
      const progressions = await this.analyzeSemanticProgression(context, mainConcept.name);
      for (const progression of progressions) {
        await this.createRelation(
          userId,
          'user', 
          progression.concept,
          progression.relation,
          progression.strength
        );
      }
    } catch (error) {
      console.error('Error creating semantic relationships:', error);
    }
  }

  // Semantic progression analysis
  async analyzeSemanticProgression(text, concept) {
    const progressions = [];
    const lowerText = text.toLowerCase();
    
    // Enhanced progression patterns with semantic understanding
    const progressPatterns = [
      { 
        indicators: ['now i understand', 'makes sense now', 'i get it', 'clear now', 'that explains'],
        relation: 'understands', 
        strength: 0.9, 
        description: 'achieved understanding' 
      },
      { 
        indicators: ['still confused', "still don't get", 'still unclear', 'not sure', 'lost'],
        relation: 'struggles_with', 
        strength: 0.8, 
        description: 'continued confusion' 
      },
      { 
        indicators: ['want to learn more', 'tell me more', 'interested in', 'curious about'],
        relation: 'interested_in', 
        strength: 0.7, 
        description: 'showing interest' 
      },
      { 
        indicators: ['this helps', 'useful', 'good explanation', "that's helpful"],
        relation: 'finding_helpful', 
        strength: 0.8, 
        description: 'positive feedback' 
      },
      { 
        indicators: ['tried this', 'implemented', 'used in class', 'applied', 'put into practice'],
        relation: 'applied', 
        strength: 0.95, 
        description: 'practical application' 
      }
    ];

    progressPatterns.forEach(pattern => {
      const found = pattern.indicators.some(indicator => lowerText.includes(indicator));
      if (found) {
        progressions.push({
          concept: concept,
          relation: pattern.relation,
          strength: pattern.strength,
          description: pattern.description
        });
      }
    });

    return progressions;
  }

  // Build teaching-specific context
  buildTeachingContext(entities, relations) {
    const teachingContext = [];
    
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

  // Extract conversation patterns for personalization
  extractConversationPatterns(conversations) {
    const patterns = [];
    
    if (conversations.length < 3) return patterns;

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

  // Database methods
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

module.exports = SemanticMemoryService;