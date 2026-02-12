
import React from 'react';

// API Key management is prohibited in UI elements as per guidelines.
// The application must not ask the user for it under any circumstances.
const ApiKeyManager: React.FC<{ onKeyUpdate: (newKey: string) => void }> = () => {
  return null;
};

export default ApiKeyManager;
