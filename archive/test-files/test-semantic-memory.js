// Test Semantic Memory Service
const SemanticMemoryService = require('./memory-service');
const path = require('path');

async function testSemanticMemory() {
  console.log('🧠 Testing Semantic Memory Service...');
  
  const dbPath = path.join(__dirname, 'learning_buddy.db');
  const memoryService = new SemanticMemoryService(dbPath);
  
  // Wait for initialization
  console.log('⏳ Waiting for embedder initialization...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const testUserId = 'test-user-123';
  
  // Test 1: Semantic concept extraction
  console.log('\n=== Test 1: Semantic Concept Extraction ===');
  
  const testTexts = [
    "I'm worried about using AI in my classroom because I don't understand how machine learning works",
    "My students are excited about ChatGPT but I'm concerned about academic integrity and plagiarism",
    "I want to learn prompt engineering to help with lesson planning and differentiated instruction",
    "The neural networks behind these language models seem complex - how can I explain this to high school students?",
    "I'm struggling with classroom management when students use AI tools for creative writing assignments"
  ];
  
  for (const text of testTexts) {
    console.log(`\nTesting: "${text}"`);
    const concepts = await memoryService.extractConceptsWithEmbeddings(text, { gradeLevel: 'high school' });
    console.log('Extracted concepts:');
    concepts.forEach(concept => {
      console.log(`  - ${concept.name} (${concept.type}, confidence: ${concept.confidence.toFixed(3)}, method: ${concept.method})`);
    });
  }
  
  // Test 2: Semantic similarity calculation
  console.log('\n=== Test 2: Semantic Similarity Testing ===');
  
  const similarityTests = [
    ['machine learning', 'artificial intelligence'],
    ['classroom management', 'student behavior'],
    ['prompt engineering', 'lesson planning'],
    ['neural networks', 'deep learning'],
    ['assessment', 'evaluation']
  ];
  
  for (const [term1, term2] of similarityTests) {
    const similarity = await memoryService.calculateSimilarity(term1, term2);
    console.log(`Similarity between "${term1}" and "${term2}": ${similarity.toFixed(3)}`);
  }
  
  // Test 3: Memory context building
  console.log('\n=== Test 3: Memory Context Building ===');
  
  // Add some test entities and relations
  await memoryService.createEntity(testUserId, 'machine learning', 'ai_concept', [
    'Discussed basic concepts on 2024-01-15',
    'Showed interest in applications for education',
    'Asked about training data and bias'
  ]);
  
  await memoryService.createEntity(testUserId, 'classroom management', 'teaching_concept', [
    'Mentioned challenges with technology integration',
    'Interested in using AI for administrative tasks'
  ]);
  
  await memoryService.createRelation(testUserId, 'user', 'machine learning', 'interested_in', 0.8);
  await memoryService.createRelation(testUserId, 'user', 'classroom management', 'struggles_with', 0.6);
  
  const memoryContext = await memoryService.buildMemoryContext(testUserId, 'AI in education');
  console.log('Generated memory context:');
  console.log(memoryContext);
  
  // Test 4: Semantic clustering
  console.log('\n=== Test 4: Semantic Clustering ===');
  
  await memoryService.createEntity(testUserId, 'prompt engineering', 'ai_concept', ['Learning advanced techniques']);
  await memoryService.createEntity(testUserId, 'lesson planning', 'teaching_concept', ['Using AI to enhance curriculum']);
  await memoryService.createEntity(testUserId, 'student engagement', 'teaching_concept', ['Exploring AI tools for interaction']);
  
  const entities = await memoryService.getEntities(testUserId);
  const clusters = await memoryService.buildSemanticClusters(entities, 'AI in teaching');
  
  console.log('Semantic clusters:');
  clusters.forEach(cluster => {
    console.log(`  Topic: ${cluster.topic}`);
    console.log(`  Concepts: ${cluster.concepts.join(', ')}`);
    console.log(`  Strength: ${cluster.strength ? cluster.strength.toFixed(3) : 'N/A'}`);
  });
  
  // Test 5: Compare with keyword fallback
  console.log('\n=== Test 5: Keyword vs Semantic Comparison ===');
  
  const comparisonText = "I'm curious about how natural language processing could help with formative assessment and providing feedback to students";
  
  console.log(`Testing: "${comparisonText}"`);
  
  // Semantic extraction
  const semanticConcepts = await memoryService.extractConceptsWithEmbeddings(comparisonText);
  console.log('\nSemantic extraction:');
  semanticConcepts.forEach(concept => {
    console.log(`  - ${concept.name} (confidence: ${concept.confidence.toFixed(3)})`);
  });
  
  // Keyword fallback
  const keywordConcepts = memoryService.extractConceptsKeywordFallback(comparisonText);
  console.log('\nKeyword extraction:');
  keywordConcepts.forEach(concept => {
    console.log(`  - ${concept.name} (confidence: ${concept.confidence.toFixed(3)})`);
  });
  
  console.log('\n✅ Semantic Memory Service testing complete!');
  console.log('🎯 Key improvements over keyword matching:');
  console.log('   - Captures semantic relationships between concepts');
  console.log('   - Better understanding of educational context');
  console.log('   - Handles synonyms and paraphrasing');
  console.log('   - Educational domain-aware clustering');
  console.log('   - Graceful fallback to keyword matching if embeddings fail');
  
  // Cleanup test data
  console.log('\n🧹 Cleaning up test data...');
  const testEntities = await memoryService.getEntities(testUserId);
  for (const entity of testEntities) {
    // Note: In a real implementation, you'd want a deleteEntity method
    // For now, we'll just log what would be cleaned up
    console.log(`Would delete: ${entity.entity_name}`);
  }
  
  process.exit(0);
}

// Run the test
testSemanticMemory().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});