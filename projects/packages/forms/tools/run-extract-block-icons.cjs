/**
 * Wrapper to run the block-icons extractor in Node with a minimal DOM (jsdom).
 * @wordpress/components and its deps (e.g. requestidlecallback) expect document,
 * MutationObserver, etc. at load time.
 */
const { JSDOM } = require( 'jsdom' );
const dom = new JSDOM( '<!DOCTYPE html><html><body></body></html>' );
const win = dom.window;
global.window = win;
global.document = win.document;
global.MutationObserver = win.MutationObserver;
global.Element = win.Element;
global.HTMLElement = win.HTMLElement;

require( require( 'path' ).resolve( __dirname, '..', 'dist', 'extract-block-icons.cjs' ) );
