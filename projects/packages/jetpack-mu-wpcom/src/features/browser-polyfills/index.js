// Loaded only in browsers that fail the feature test in browser-polyfills.php. Babel replaces the core-js
// import with only the modules the oldest supported browsers lack; see browser-polyfills.webpack.config.js.
import 'core-js/stable';

// The Tracks script sends queued events once it loads later on the page.
window._tkq = window._tkq || [];
window._tkq.push( [ 'recordEvent', 'wpcom_browser_polyfill_used', {} ] );
