// Suppress browser extension errors that don't affect the application
(function() {
  'use strict';
  
  // Store original console.error
  const originalError = console.error;
  
  // Override console.error to filter out extension-related errors
  console.error = function(...args) {
    const message = args.join(' ');
    
    // Filter out common extension errors that don't affect the app
    const extensionErrors = [
      'Could not establish connection. Receiving end does not exist',
      'Extension context invalidated',
      'polyfill.js',
      'chrome-extension://',
      'moz-extension://',
      'safari-extension://'
    ];
    
    // Check if this is an extension error
    const isExtensionError = extensionErrors.some(error => 
      message.toLowerCase().includes(error.toLowerCase())
    );
    
    // Only log non-extension errors
    if (!isExtensionError) {
      originalError.apply(console, args);
    }
  };
  
  // Also handle unhandled promise rejections from extensions
  window.addEventListener('unhandledrejection', function(event) {
    const message = event.reason?.message || event.reason || '';
    
    if (typeof message === 'string' && 
        message.includes('Could not establish connection')) {
      event.preventDefault(); // Prevent the error from showing
    }
  });
  
  console.log('🔇 Extension error suppression loaded');
})();