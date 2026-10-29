// Usage: node consent-gate-harness.js <gate.js> <scenario>. Prints what the gate did in a stub browser.
const fs = require( 'fs' );
const vm = require( 'vm' );

const [ gatePath, scenario ] = process.argv.slice( 2 );
const gate = fs.readFileSync( gatePath, 'utf8' );

const listeners = { document: {}, window: {} };
const on = target => ( type, listener ) => {
	( listeners[ target ][ type ] = listeners[ target ][ type ] || [] ).push( listener );
};
const dispatch = ( target, type, detail ) =>
	( listeners[ target ][ type ] || [] ).forEach( listener => listener( { detail } ) );

const result = { views: 0, warnings: 0, error: null };
const page = {
	document: { readyState: 'loading', addEventListener: on( 'document' ) },
	addEventListener: on( 'window' ),
	console: { warn: () => result.warnings++ },
};
page.window = page;
vm.createContext( page );
const loadGate = () => vm.runInContext( gate, page );

const scenarios = {
	'allowed before the page is ready': () => {
		page.wp_has_consent = () => true;
		loadGate();
		dispatch( 'document', 'DOMContentLoaded' );
		dispatch( 'window', 'load' );
	},
	'denied, then allowed in the banner': () => {
		page.wp_has_consent = () => false;
		loadGate();
		dispatch( 'document', 'DOMContentLoaded' );
		dispatch( 'document', 'wp_listen_for_consent_change', { statistics: 'allow' } );
		dispatch( 'document', 'wp_listen_for_consent_change', { statistics: 'allow' } );
	},
	'denied in a banner that sets no consent type': () => {
		page.wp_has_consent = () => true;
		page.consent_api = { cookie_prefix: 'wp_consent' };
		page.consent_api_get_cookie = name => ( name === 'wp_consent_statistics' ? 'deny' : '' );
		loadGate();
		dispatch( 'document', 'DOMContentLoaded' );
		dispatch( 'window', 'load' );
	},
	'consent API that loads only by the load event': () => {
		loadGate();
		dispatch( 'document', 'DOMContentLoaded' );
		page.wp_has_consent = () => true;
		dispatch( 'window', 'load' );
	},
	'consent API that never loads': () => {
		loadGate();
		dispatch( 'document', 'DOMContentLoaded' );
		dispatch( 'window', 'load' );
	},
	'consent API that throws': () => {
		page.wp_has_consent = () => {
			throw new Error( 'consent API' );
		};
		loadGate();
		dispatch( 'document', 'DOMContentLoaded' );
	},
	'stats sender that throws': () => {
		page.wp_has_consent = () => true;
		page._stq = {
			push: () => {
				throw new Error( 'stats sender' );
			},
		};
		loadGate();
		dispatch( 'document', 'DOMContentLoaded' );
	},
};

try {
	scenarios[ scenario ]();
} catch ( error ) {
	result.error = error.message;
}
if ( Array.isArray( page._stq ) ) {
	result.views = page._stq.filter( ( [ name ] ) => name === 'view' ).length;
}
process.stdout.write( JSON.stringify( result ) );
