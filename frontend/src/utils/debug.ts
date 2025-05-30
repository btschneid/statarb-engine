// Debug configuration
export const DEBUG = true; // Set to false to disable all debug logs

// Debug logging utility functions
export const debugLog = (...args: any[]) => {
  if (DEBUG) {
    console.log(...args);
  }
};

export const debugError = (...args: any[]) => {
  if (DEBUG) {
    console.error(...args);
  }
};

export const debugWarn = (...args: any[]) => {
  if (DEBUG) {
    console.warn(...args);
  }
}; 