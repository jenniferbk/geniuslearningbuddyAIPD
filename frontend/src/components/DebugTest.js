// Quick debug component to test if changes are loading
import React from 'react';

const DebugTest = () => {
  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'red', 
      color: 'white', 
      padding: '10px',
      zIndex: 9999 
    }}>
      🚨 DEBUG: Changes Loaded! Header should be "AI Buddy" and transcript button should be visible.
    </div>
  );
};

export default DebugTest;
