
import { Platform } from "react-native";

/**
 * Clear error after a delay
 */
export const clearErrorAfterDelay = (errorKey: string) => {
  setTimeout(() => {
    console.log(`Clearing error: ${errorKey}`);
  }, 5000);
};

/**
 * Send error to parent window (for web)
 */
export const sendErrorToParent = (level: string, message: string, data: any) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      window.parent.postMessage(
        {
          type: 'error',
          level,
          message,
          data,
        },
        '*'
      );
    } catch (error) {
      console.error('Failed to send error to parent:', error);
    }
  }
};

/**
 * Extract source location from stack trace
 */
export const extractSourceLocation = (stack: string): string => {
  try {
    const lines = stack.split('\n');
    if (lines.length > 1) {
      const match = lines[1].match(/\((.+):(\d+):(\d+)\)/);
      if (match) {
        return `${match[1]}:${match[2]}:${match[3]}`;
      }
    }
  } catch (error) {
    console.error('Failed to extract source location:', error);
  }
  return 'unknown';
};

/**
 * Get caller information
 */
export const getCallerInfo = (): string => {
  try {
    const stack = new Error().stack || '';
    return extractSourceLocation(stack);
  } catch (error) {
    console.error('Failed to get caller info:', error);
    return 'unknown';
  }
};

/**
 * Log error with context
 */
export const errorLogger = (error: any, context?: string) => {
  const errorMessage = error?.message || String(error);
  const errorStack = error?.stack || '';
  const location = extractSourceLocation(errorStack);
  
  console.error(`[ERROR] ${context ? `${context}: ` : ''}${errorMessage}`);
  console.error(`Location: ${location}`);
  
  if (errorStack) {
    console.error('Stack trace:', errorStack);
  }
  
  sendErrorToParent('error', errorMessage, {
    context,
    location,
    stack: errorStack,
  });
};

export default errorLogger;
