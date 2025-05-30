// Primer-like Enhanced Memory Functions
// Advanced memory processing for AI Learning Buddy

// Enhanced memory update function with Primer-like intelligence
async function updateMemoryWithPrimerIntelligence(memoryService, userId, userMessage, aiResponse, currentTopic, userProfile) {
  try {
    const updates = [];
    
    // PRIMER-LIKE INSIGHT EXTRACTION
    const insights = extractPrimerLikeInsights(userMessage, aiResponse, userProfile);
    
    for (const insight of insights) {
      // Create nuanced memory entities
      await memoryService.createEntity(userId, insight.concept, insight.type, [insight.observation]);
      
      // Build sophisticated relationships
      if (insight.relationship) {
        await memoryService.createRelation(
          userId, 
          insight.relationship.from, 
          insight.relationship.to, 
          insight.relationship.type, 
          insight.relationship.strength
        );
      }
      
      updates.push(insight.summary);
    }
    
    // LEARNING JOURNEY ANALYSIS
    const journeyInsights = await analyzeLearningJourney(memoryService, userId, userMessage, aiResponse);
    updates.push(...journeyInsights);
    
    // TEACHING CONTEXT EVOLUTION
    const contextEvolution = await trackTeachingContextEvolution(memoryService, userId, userMessage, userProfile);
    updates.push(...contextEvolution);
    
    return updates.filter(update => update.length > 0); // Remove empty updates
    
  } catch (error) {
    console.error('Enhanced memory update error:', error);
    return ['Memory system learning from this interaction'];
  }
}

// Primer-like insight extraction - understands deeper meaning
function extractPrimerLikeInsights(userMessage, aiResponse, userProfile) {
  const insights = [];
  const messageText = userMessage.toLowerCase();
  const responseText = aiResponse.toLowerCase();
  
  // EMOTIONAL STATE INSIGHTS
  if (messageText.includes('frustrated') || messageText.includes('struggling')) {
    insights.push({
      concept: 'current_emotional_state',
      type: 'emotional_context',
      observation: `Expressing frustration about: ${extractFrustrationContext(userMessage)}`,
      relationship: {
        from: 'user',
        to: 'current_challenge',
        type: 'experiencing_difficulty',
        strength: 0.8
      },
      summary: `Understanding your current challenge with ${extractFrustrationContext(userMessage)}`
    });
  }
  
  if (messageText.includes('excited') || messageText.includes('love this') || messageText.includes('amazing')) {
    insights.push({
      concept: 'positive_engagement',
      type: 'emotional_context',
      observation: `Showing enthusiasm for: ${extractEnthusiasmContext(userMessage)}`,
      relationship: {
        from: 'user',
        to: 'ai_exploration',
        type: 'shows_enthusiasm',
        strength: 0.9
      },
      summary: `Noting your enthusiasm for ${extractEnthusiasmContext(userMessage)}`
    });
  }
  
  // TEACHING CHALLENGE INSIGHTS
  if (messageText.includes('students') && (messageText.includes('don\'t') || messageText.includes('struggle'))) {
    const challenge = extractTeachingChallenge(userMessage);
    insights.push({
      concept: `student_challenge_${challenge}`,
      type: 'teaching_challenge',
      observation: `Student challenge identified: ${challenge} in ${userProfile.grade_level} ${userProfile.subjects?.join('/')} context`,
      relationship: {
        from: 'teaching_practice',
        to: challenge,
        type: 'needs_support_with',
        strength: 0.7
      },
      summary: `Recognizing your students' challenges with ${challenge}`
    });
  }
  
  // IMPLEMENTATION INTENT
  if (messageText.includes('try this') || messageText.includes('implement') || messageText.includes('use in my class')) {
    const tool = extractImplementationIntent(userMessage, aiResponse);
    insights.push({
      concept: `implementation_intent_${tool}`,
      type: 'action_planning',
      observation: `Planning to implement ${tool} in classroom context`,
      relationship: {
        from: 'user',
        to: tool,
        type: 'planning_to_implement',
        strength: 0.9
      },
      summary: `Supporting your plan to try ${tool} with your students`
    });
  }
  
  // CONCEPTUAL BREAKTHROUGH
  if (messageText.includes('now i understand') || messageText.includes('makes sense') || messageText.includes('i see how')) {
    const concept = extractBreakthroughConcept(userMessage);
    insights.push({
      concept: `understanding_${concept}`,
      type: 'conceptual_growth',
      observation: `Achieved understanding breakthrough: ${concept}`,
      relationship: {
        from: 'user',
        to: concept,
        type: 'achieved_understanding',
        strength: 1.0
      },
      summary: `Celebrating your breakthrough understanding of ${concept}`
    });
  }
  
  return insights;
}

// Helper functions for context extraction
function extractFrustrationContext(message) {
  const patterns = [
    /frustrated with (.*?)(?:\.|$)/i,
    /struggling with (.*?)(?:\.|$)/i,
    /having trouble with (.*?)(?:\.|$)/i
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) return match[1].trim();
  }
  
  return 'current teaching challenge';
}

function extractEnthusiasmContext(message) {
  const patterns = [
    /excited about (.*?)(?:\.|$)/i,
    /love this (.*?)(?:\.|$)/i,
    /amazing how (.*?)(?:\.|$)/i
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) return match[1].trim();
  }
  
  return 'AI exploration';
}

function extractTeachingChallenge(message) {
  const challenges = [
    'engagement', 'motivation', 'understanding', 'participation',
    'attention', 'comprehension', 'collaboration', 'creativity'
  ];
  
  for (const challenge of challenges) {
    if (message.toLowerCase().includes(challenge)) {
      return challenge;
    }
  }
  
  return 'learning_support';
}

function extractImplementationIntent(userMessage, aiResponse) {
  const tools = [
    'chatgpt', 'ai tools', 'prompting', 'lesson planning',
    'assessment', 'feedback', 'differentiation', 'personalization'
  ];
  
  const combined = (userMessage + ' ' + aiResponse).toLowerCase();
  
  for (const tool of tools) {
    if (combined.includes(tool)) {
      return tool;
    }
  }
  
  return 'ai_integration';
}

function extractBreakthroughConcept(message) {
  const concepts = [
    'ai capabilities', 'prompt engineering', 'personalization',
    'assessment', 'feedback', 'differentiation', 'ai ethics'
  ];
  
  for (const concept of concepts) {
    if (message.toLowerCase().includes(concept.split(' ')[0])) {
      return concept;
    }
  }
  
  return 'ai_understanding';
}

// Advanced learning journey analysis
async function analyzeLearningJourney(memoryService, userId, userMessage, aiResponse) {
  try {
    const insights = [];
    
    // Get recent learning progression
    const recentEntities = await memoryService.getEntities(userId, null, null);
    const progressionPattern = analyzeProgressionPattern(recentEntities);
    
    if (progressionPattern.length > 0) {
      insights.push(`Observing your learning pattern: ${progressionPattern}`);
    }
    
    return insights;
  } catch (error) {
    console.error('Learning journey analysis error:', error);
    return [];
  }
}

function analyzeProgressionPattern(entities) {
  // Analyze the user's learning progression over time
  const recentTypes = entities
    .slice(0, 10)
    .map(e => e.entity_type)
    .reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
  
  const dominantType = Object.keys(recentTypes)
    .reduce((a, b) => recentTypes[a] > recentTypes[b] ? a : b, '');
  
  const patterns = {
    'emotional_context': 'building confidence and comfort with AI',
    'teaching_challenge': 'focusing on practical classroom applications',
    'conceptual_growth': 'developing deep understanding of AI concepts',
    'action_planning': 'moving toward implementation and practice'
  };
  
  return patterns[dominantType] || 'exploring AI literacy comprehensively';
}

// Teaching context evolution tracking
async function trackTeachingContextEvolution(memoryService, userId, userMessage, userProfile) {
  try {
    const insights = [];
    
    // Track how their teaching context understanding evolves
    const teachingEntities = await memoryService.getEntities(userId, 'teaching_challenge', null);
    
    if (teachingEntities.length > 3) {
      const evolution = analyzeTeachingEvolution(teachingEntities, userProfile);
      if (evolution) {
        insights.push(`Your teaching focus is evolving: ${evolution}`);
      }
    }
    
    return insights;
  } catch (error) {
    console.error('Teaching context evolution error:', error);
    return [];
  }
}

function analyzeTeachingEvolution(teachingEntities, userProfile) {
  // Analyze how the teacher's focus and challenges are evolving
  const recent = teachingEntities.slice(0, 3);
  const earlier = teachingEntities.slice(3, 6);
  
  const recentFocus = recent.map(e => e.entity_name).join(', ');
  const earlierFocus = earlier.map(e => e.entity_name).join(', ');
  
  if (recentFocus !== earlierFocus) {
    return `from ${earlierFocus} toward ${recentFocus}`;
  }
  
  return null;
}

// Export the enhanced functions
module.exports = {
  updateMemoryWithPrimerIntelligence,
  extractPrimerLikeInsights,
  analyzeLearningJourney,
  trackTeachingContextEvolution
};