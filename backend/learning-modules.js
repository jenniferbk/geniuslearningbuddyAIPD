// Basic AI Literacy Course Content
// This defines the learning modules, objectives, and adaptive content

const basicAILiteracyModule = {
  id: 'basic_ai_literacy',
  name: 'Basic AI Literacy for Educators',
  description: 'Foundational understanding of AI technologies and their educational applications',
  estimatedDuration: '4-6 hours',
  
  learningObjectives: [
    'Understand what artificial intelligence is and how it works at a basic level',
    'Identify different types of AI tools and their capabilities',
    'Recognize potential benefits and limitations of AI in education',
    'Develop awareness of AI ethics and bias considerations',
    'Practice basic interaction with AI tools'
  ],

  topics: [
    {
      id: 'what_is_ai',
      name: 'What is Artificial Intelligence?',
      description: 'Basic concepts and definitions',
      keyPoints: [
        'AI as computer systems that can perform tasks typically requiring human intelligence',
        'Difference between AI, machine learning, and automation',
        'How AI systems learn from data',
        'Common AI applications in daily life'
      ],
      
      conversationStarters: [
        "Let's start with the basics - what comes to mind when you hear 'artificial intelligence'?",
        "Have you used any AI tools before? Maybe without realizing it?",
        "What's one thing you're curious about regarding AI?"
      ],
      
      scaffoldingQuestions: {
        novice: [
          "Can you think of any apps or websites you use that might use AI?",
          "What's the difference between a calculator and an AI system?"
        ],
        intermediate: [
          "How do you think AI systems learn to recognize patterns?",
          "What role does data play in AI development?"
        ],
        expert: [
          "How might different machine learning approaches affect AI behavior in educational contexts?",
          "What are the implications of training data bias for educational AI tools?"
        ]
      }
    },

    {
      id: 'types_of_ai',
      name: 'Types of AI Tools',
      description: 'Overview of different AI categories and applications',
      keyPoints: [
        'Text generation (like ChatGPT)',
        'Image creation and analysis',
        'Voice and speech recognition',
        'Recommendation systems',
        'Educational AI tutors and assistants'
      ],
      
      conversationStarters: [
        "Which type of AI tool do you think would be most useful in your classroom?",
        "Have you tried any text-based AI like ChatGPT or similar tools?",
        "What tasks do you do as a teacher that you think AI might help with?"
      ],
      
      practiceActivities: [
        {
          type: 'exploration',
          description: 'Try different types of prompts with an AI text tool',
          prompts: [
            'Ask for a lesson plan outline',
            'Request explanation of a concept at grade level',
            'Get suggestions for classroom activities'
          ]
        }
      ]
    },

    {
      id: 'ai_in_education',
      name: 'AI in Educational Settings',
      description: 'Benefits, challenges, and practical applications',
      keyPoints: [
        'Personalized learning opportunities',
        'Administrative task automation',
        'Content creation and adaptation',
        'Assessment and feedback support',
        'Accessibility improvements'
      ],
      
      challenges: [
        'Ensuring accuracy and reliability',
        'Maintaining human connection',
        'Privacy and data concerns',
        'Digital equity issues',
        'Over-dependence risks'
      ],
      
      conversationStarters: [
        "What's your biggest challenge as a teacher that you think AI might help with?",
        "What concerns do you have about using AI in education?",
        "How do you balance technology use with traditional teaching?"
      ]
    },

    {
      id: 'ethics_and_bias',
      name: 'AI Ethics and Bias',
      description: 'Critical considerations for responsible AI use',
      keyPoints: [
        'Understanding algorithmic bias',
        'Importance of diverse training data',
        'Transparency and explainability',
        'Student privacy considerations',
        'Academic integrity questions'
      ],
      
      scenarios: [
        {
          situation: 'An AI tool gives different quality responses for names from different cultural backgrounds',
          discussion: 'How might this bias affect student experiences? What should teachers watch for?'
        },
        {
          situation: 'Students want to use AI for homework assignments',
          discussion: 'How do we balance AI assistance with learning objectives?'
        }
      ]
    },

    {
      id: 'hands_on_practice',
      name: 'Hands-on AI Practice',
      description: 'Guided practice with AI tools',
      activities: [
        {
          type: 'prompt_engineering',
          description: 'Learn to write effective prompts',
          examples: [
            'Vague: "Help with math"',
            'Better: "Create 5 word problems for 4th grade multiplication that involve real-world scenarios"',
            'Best: "Create 5 word problems for 4th grade multiplication (2-digit x 1-digit) that involve real-world scenarios my students can relate to. Include diverse character names and avoid stereotypes."'
          ]
        },
        {
          type: 'evaluation',
          description: 'Critically assess AI-generated content',
          checkpoints: [
            'Accuracy of information',
            'Age-appropriateness',
            'Cultural sensitivity',
            'Alignment with learning objectives'
          ]
        }
      ]
    }
  ],

  adaptiveResponses: {
    // Based on teacher profile and progress
    elementary: {
      language: 'simple, concrete examples',
      examples: 'elementary classroom scenarios',
      focus: 'practical classroom applications'
    },
    middle: {
      language: 'age-appropriate balance',
      examples: 'middle school contexts',
      focus: 'student independence and digital citizenship'
    },
    high: {
      language: 'more sophisticated concepts',
      examples: 'high school and college prep',
      focus: 'critical thinking and ethical reasoning'
    },
    
    techComfort: {
      low: {
        pace: 'slower, more explanation',
        support: 'step-by-step guidance',
        reassurance: 'frequent encouragement'
      },
      medium: {
        pace: 'moderate',
        support: 'balanced guidance',
        reassurance: 'confidence building'
      },
      high: {
        pace: 'faster',
        support: 'minimal scaffolding',
        reassurance: 'challenge-focused'
      }
    }
  },

  assessmentCriteria: {
    understanding: [
      'Can explain AI concepts in their own words',
      'Identifies appropriate AI tools for specific tasks',
      'Recognizes limitations and potential issues'
    ],
    application: [
      'Writes effective prompts for AI tools',
      'Evaluates AI-generated content critically',
      'Integrates AI considerations into lesson planning'
    ],
    reflection: [
      'Considers ethical implications',
      'Identifies personal learning needs',
      'Plans next steps for AI integration'
    ]
  }
};

const advancedModules = {
  lesson_planning: {
    id: 'ai_lesson_planning',
    name: 'AI-Enhanced Lesson Planning',
    description: 'Using AI tools to create and improve lesson plans',
    prerequisites: ['basic_ai_literacy'],
    // Will be developed in Phase 2
  },
  
  assessment: {
    id: 'ai_assessment',
    name: 'AI in Student Assessment',
    description: 'Leveraging AI for feedback, grading, and evaluation',
    prerequisites: ['basic_ai_literacy'],
    // Will be developed in Phase 2
  },
  
  stem_integration: {
    id: 'ai_stem_classrooms',
    name: 'AI in STEM Classrooms',
    description: 'Subject-specific AI applications for science and math',
    prerequisites: ['basic_ai_literacy', 'ai_lesson_planning'],
    // Will be developed in Phase 2
  }
};

module.exports = {
  basicAILiteracyModule,
  advancedModules
};
