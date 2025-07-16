# My Jetpack Error Tracker

A comprehensive JavaScript error tracking solution for the My Jetpack interface, providing real-time error monitoring and analytics integration.

## Overview

The My Jetpack Error Tracker is built on the `JPJSErrorTracker` library, a lightweight and powerful error monitoring solution that captures all JavaScript errors, resource failures, network issues, and performance problems occurring in the My Jetpack dashboard.

## Features

### 🔍 **Comprehensive Error Monitoring**
- **JavaScript Errors**: Captures all unhandled JavaScript exceptions with full stack traces
- **Resource Errors**: Monitors failed image, script, and stylesheet loads
- **Network Errors**: Tracks failed fetch requests and XMLHttpRequest failures
- **Promise Rejections**: Catches unhandled promise rejections
- **Performance Issues**: Detects long-running tasks (>50ms) that may impact user experience

### 🛡️ **Security & Privacy**
- **Unique Session IDs**: Generates unique session identifiers to correlate error events
- **Data Sanitization**: Automatically truncates sensitive data and limits message lengths
- **Privacy Conscious**: No personal data collection beyond standard browser context

### 📊 **Rich Context Collection**
Each error report includes:
- **Session Information**: Unique session ID, timestamp, error count
- **Location Data**: Current route, URL, pathname, search parameters
- **Browser Context**: User agent, viewport dimensions, language, platform
- **Page State**: Title, referrer, ready state, time from page load
- **Error Details**: Stack trace, filename, line/column numbers, error type

### ⚡ **Performance Optimized**
- **Error Throttling**: Prevents spam with 1-second throttling per unique error
- **Lightweight**: Minimal performance impact on application
- **Non-blocking**: Errors in tracking don't affect main application flow

### 📈 **Analytics Integration**
- **Jetpack Analytics**: Seamless integration with Jetpack's analytics system
- **Structured Data**: Consistent error properties for analysis and reporting
- **Route Tracking**: Correlates errors with specific My Jetpack routes

## Usage

### Basic Setup

The error tracker is automatically initialized when the My Jetpack interface loads:

```javascript
import { initializeErrorTracker } from './utils/error-tracker';

// Initialize error tracking before React app
initializeErrorTracker();
```

### Manual Usage

For custom implementations or testing:

```javascript
// Create a new error tracker instance
const errorTracker = new window.JPJSErrorTracker(error => {
    // Handle error data
    console.log('Error captured:', error);
});
```

## Error Data Structure

Each captured error includes the following properties:

```javascript
{
    // Error specifics
    type: 'javascript|resource|network|promise|performance',
    message: 'Error description',
    filename: 'source-file.js',
    lineno: 42,
    colno: 15,
    stack: 'Error stack trace...',
    
    // Context
    sessionId: 'jp_1234567890_abc123def456',
    timestamp: 1234567890123,
    context: 'my-jetpack',
    route: '#/dashboard',
    
    // Browser environment
    userAgent: 'Mozilla/5.0...',
    viewport: { width: 1920, height: 1080 },
    url: 'https://example.com/wp-admin/admin.php?page=my-jetpack',
    
    // Performance
    timeFromPageLoad: 5432,
    errorCount: 1,
    
    // Location details
    location: {
        pathname: '/wp-admin/admin.php',
        search: '?page=my-jetpack',
        hash: '#/dashboard',
        host: 'example.com'
    },
    
    // Browser capabilities
    browser: {
        language: 'en-US',
        platform: 'MacIntel',
        cookieEnabled: true,
        onLine: true
    },
    
    // Page state
    page: {
        title: 'My Jetpack ‹ Site Name — WordPress',
        referrer: 'https://example.com/wp-admin/',
        readyState: 'complete'
    }
}
```

## Error Types

### JavaScript Errors
- Syntax errors, reference errors, type errors
- Captured via `window.onerror` and `error` event listeners
- Includes full stack traces when available

### Resource Errors
- Failed image loads, missing scripts, broken stylesheets
- Monitored through error event listeners on DOM elements
- Tracks both existing and dynamically added resources

### Network Errors
- Failed fetch requests and XMLHttpRequest errors
- Intercepts and monitors network calls
- Preserves original functionality while adding monitoring

### Promise Rejections
- Unhandled promise rejections
- Captured via `unhandledrejection` event listener
- Includes error details and stack traces

### Performance Issues
- Long-running tasks detected via Performance Observer API
- Configurable threshold (default: 50ms)
- Helps identify performance bottlenecks

## Benefits

### 🚀 **Improved User Experience**
- **Proactive Issue Detection**: Catch errors before users report them
- **Performance Monitoring**: Identify and fix slow interactions
- **Resource Optimization**: Detect broken assets and loading issues

### 🔧 **Developer Productivity**
- **Rich Debug Information**: Complete error context for faster debugging
- **Route-Specific Tracking**: Identify which My Jetpack features have issues
- **Trend Analysis**: Historical error data for pattern recognition

### 📊 **Data-Driven Decisions**
- **Error Rate Monitoring**: Track error frequency and trends
- **Browser Compatibility**: Identify browser-specific issues
- **Feature Stability**: Monitor error rates after deployments

### 🛡️ **Reliability & Security**
- **Secure Session Tracking**: Unique session IDs for error correlation
- **Error Isolation**: Tracking errors don't crash the application
- **Privacy Conscious**: Data sanitization and length limits

## Configuration

### Throttling
```javascript
// Default throttle time is 5000ms (5 seconds)
// Prevents duplicate error spam
const errorTracker = new window.JPJSErrorTracker(onError, { 
    throttleMs: 5000,
    maxErrors: 100 
});
```

### Analytics Properties
Error data sent to analytics includes:
- `error_message`: Truncated to 100 characters
- `error_filename`: Source file or 'unknown'
- `error_lineno`: Line number or 0
- `error_colno`: Column number or 0
- `error_route`: Current route or 'none'
- `error_user_agent`: Truncated to 100 characters
- `error_viewport_width`: Browser viewport width
- `error_viewport_height`: Browser viewport height

## File Structure

```
projects/packages/my-jetpack/
├── src/js-static/
│   └── jp-js-error-tracker.js    # Core error tracking library
├── _inc/
│   ├── utils/
│   │   └── error-tracker.js      # My Jetpack integration
│   └── admin.jsx                 # Main application with error tracker initialization
└── ERROR_TRACKER.md              # This documentation
```

## Browser Support

- **Modern Browsers**: Full feature support including Performance Observer
- **Legacy Browsers**: Graceful degradation with core error tracking
- **Session IDs**: Uses secure random generation when available, falls back to Math.random()
- **Performance Observer**: Optional feature for performance monitoring

## Contributing

When modifying the error tracker:

1. **Test Thoroughly**: Ensure error tracking doesn't interfere with normal operation
2. **Maintain Privacy**: Don't log sensitive user data
3. **Performance First**: Keep tracking overhead minimal
4. **Backward Compatibility**: Support older browsers where possible

## Security Considerations

- Session IDs use secure random number generation when available
- Error messages are truncated to prevent data leakage
- No sensitive user data is collected or transmitted
- Analytics errors are caught and logged to prevent infinite loops

---

*This error tracker was implemented to provide comprehensive monitoring and improve the reliability of the My Jetpack interface while maintaining user privacy and application performance.*