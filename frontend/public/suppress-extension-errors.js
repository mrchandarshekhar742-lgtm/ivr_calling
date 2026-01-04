// Suppress browser extension errors that don't affect the application
(function() {
  'use strict';
  
  console.log('🔇 Extension error suppression loaded');
  
  // Store original console methods
  const originalError = console.error;
  const originalWarn = console.warn;
  
  // Extension-related error patterns to suppress
  const extensionErrorPatterns = [
    /Could not establish connection\. Receiving end does not exist/,
    /Extension context invalidated/,
    /The message port closed before a response was received/,
    /chrome-extension:/,
    /moz-extension:/,
    /safari-extension:/,
    /Unchecked runtime\.lastError/,
    /Cannot access contents of/,
    /Script error/,
    /polyfill\.js/
  ];
  
  // Audio-related error patterns that we want to handle gracefully
  const audioErrorPatterns = [
    /Failed to load resource.*\.mp3/,
    /Failed to load resource.*\.wav/,
    /Failed to load resource.*\.ogg/,
    /Failed to load resource.*\.aac/,
    /net::ERR_BLOCKED_BY_RESPONSE/,
    /The element has no supported sources/,
    /NotSupportedError/
  ];
  
  function shouldSuppressError(message) {
    const messageStr = String(message);
    return extensionErrorPatterns.some(pattern => pattern.test(messageStr));
  }
  
  function isAudioError(message) {
    const messageStr = String(message);
    return audioErrorPatterns.some(pattern => pattern.test(messageStr));
  }
  
  // Override console.error
  console.error = function(...args) {
    const message = args.join(' ');
    
    if (shouldSuppressError(message)) {
      // Silently suppress extension errors
      return;
    }
    
    if (isAudioError(message)) {
      // Log audio errors with a prefix for easier debugging
      originalError.apply(console, ['🎵 Audio error:', ...args]);
      return;
    }
    
    // Log all other errors normally
    originalError.apply(console, args);
  };
  
  // Override console.warn for extension warnings
  console.warn = function(...args) {
    const message = args.join(' ');
    
    if (shouldSuppressError(message)) {
      // Silently suppress extension warnings
      return;
    }
    
    // Log all other warnings normally
    originalWarn.apply(console, args);
  };
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    const message = event.reason ? String(event.reason) : '';
    
    if (shouldSuppressError(message)) {
      event.preventDefault();
      return;
    }
    
    if (isAudioError(message)) {
      console.error('🎵 Unhandled audio error:', event.reason);
      event.preventDefault();
      return;
    }
  });
  
  // Handle global errors
  window.addEventListener('error', function(event) {
    const message = event.message || '';
    
    if (shouldSuppressError(message)) {
      event.preventDefault();
      return;
    }
    
    if (isAudioError(message)) {
      console.error('🎵 Global audio error:', event.message, event.filename, event.lineno);
      event.preventDefault();
      return;
    }
  });
  
})();