// content-aware-chat.js - Enhanced chat integration for content awareness
const express = require('express');

// Content-aware prompt builder
function buildContentAwarePrompt(userMessage, enhancedContext, contentContext) {
  let systemPrompt = enhancedContext.systemPrompt || `You are an AI Learning Buddy helping K-12 teachers learn about AI in education. `;
  
  // Add content context if available
  if (contentContext && contentContext.chunk) {
    systemPrompt += `

CURRENT CONTENT CONTEXT:
The user is currently watching a video about "${contentContext.chunk.topic}" at timestamp ${contentContext.timestamp} seconds.

Current video content: "${contentContext.chunk.content}"

You can reference this content specifically and even suggest timestamps for the user to review. For example:
- "I see you're at the part about ${contentContext.chunk.topic}. Let me elaborate on what the instructor just mentioned..."
- "Would you like to jump back to ${Math.max(0, contentContext.timestamp - 30)} where they first introduced this concept?"
- "This relates to what you watched earlier..."

When suggesting timestamp jumps, format as: {action: 'jump_to_timestamp', timestamp: 123}

Make connections between the current video content and the user's question. Reference specific parts of what they're watching.
`;
  }

  // Add user suggestions from video context
  if (contentContext && contentContext.suggestions && contentContext.suggestions.length > 0) {
    systemPrompt += `

USER-SPECIFIC SUGGESTIONS based on their learning history:
${contentContext.suggestions.map(s => `- ${s.message}`).join('\n')}

Consider incorporating these insights into your response if relevant.
`;
  }

  systemPrompt += `

Be conversational, supportive, and reference the video content when helpful. Make the user feel like you're watching along with them.`;

  return {
    systemPrompt,
    userMessage
  };
}

// Response processor for content-aware features
function processContentAwareResponse(aiResponse, contentContext) {
  const responseText = aiResponse.choices[0].message.content;
  
  // Extract timestamp suggestions from AI response
  const timestampMatch = responseText.match(/\{action:\s*'jump_to_timestamp',\s*timestamp:\s*(\d+)\}/);
  
  let suggestion = null;
  let cleanedResponse = responseText;
  
  if (timestampMatch) {
    suggestion = {
      action: 'jump_to_timestamp',
      timestamp: parseInt(timestampMatch[1])
    };
    cleanedResponse = responseText.replace(timestampMatch[0], '').trim();
  }

  // Determine what content was referenced
  let contentReference = null;
  if (contentContext && contentContext.chunk && responseText.includes(contentContext.chunk.topic)) {
    contentReference = {
      referencedContent: contentContext.chunk.topic,
      timestamp: contentContext.timestamp
    };
  }

  return {
    text: cleanedResponse,
    contentReference,
    suggestion
  };
}

// Enhanced memory update with content context
async function updateMemoryWithContentContext(memoryService, userId, userMessage, aiResponse, contentContext, userProfile) {
  const baseUpdates = await memoryService.updateFromConversation(
    userId, 
    userMessage, 
    aiResponse, 
    'content_learning',
    userProfile
  );

  // Add content-specific memory updates
  if (contentContext && contentContext.chunk) {
    const contentUpdates = [
      {
        type: 'content_interaction',
        entity: contentContext.chunk.topic,
        entityType: 'learning_content',
        observation: `Engaged with video content about ${contentContext.chunk.topic} at timestamp ${contentContext.timestamp}`,
        timestamp: new Date().toISOString()
      },
      {
        type: 'progress_marker',
        entity: contentContext.videoId,
        entityType: 'video_progress',
        observation: `Reached timestamp ${contentContext.timestamp} in video ${contentContext.videoId}`,
        timestamp: new Date().toISOString()
      }
    ];

    // Add content-specific relationship
    if (baseUpdates.entities && baseUpdates.entities.length > 0) {
      contentUpdates.push({
        type: 'content_connection',
        from: baseUpdates.entities[0].name,
        to: contentContext.chunk.topic,
        relationType: 'learned_from_content',
        strength: 0.7
      });
    }

    return {
      ...baseUpdates,
      contentUpdates
    };
  }

  return baseUpdates;
}

module.exports = {
  buildContentAwarePrompt,
  processContentAwareResponse,
  updateMemoryWithContentContext
};