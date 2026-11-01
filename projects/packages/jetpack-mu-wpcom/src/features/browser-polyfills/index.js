// Loaded only in browsers that fail the feature test in browser-polyfills.php. Babel replaces the core-js
// import with only the modules the oldest supported browsers lack; see the override in babel.config.js.
import 'core-js/stable';

// Not wpcomTrackEvent: code outside this directory is compiled for current browsers only.
window._tkq = window._tkq || [];
window._tkq.push( [ 'recordEvent', 'wpcom_browser_polyfill_used', {} ] );
