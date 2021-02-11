/**
 * For a detailed explanation of configuration properties, visit:
 * https://playwright.dev/docs/api/class-browsertype?_highlight=launch#browsertypelaunchoptions
 */

let { E2E_DEBUG, HEADLESS, SLOWMO } = process.env;

if ( E2E_DEBUG ) {
	process.env.DEBUG = 'pw:browser|api|error';
	HEADLESS = 'false';
}

process.env.DEBUG = 'pw:browser|api|error';

module.exports = {
	exitOnPageError: false,
	launchOptions: {
		headless: HEADLESS !== 'false',
		devtools: HEADLESS === 'false',
		slowMo: parseInt( SLOWMO, 10 ) || 0,
		logger: {
			// eslint-disable-next-line no-unused-vars
			isEnabled: ( name, severity ) => name === 'browser',
			// eslint-disable-next-line no-unused-vars
			log: ( name, severity, message, args ) => console.log( `${ name } >>>> ${ message }` ),
		},
	},
	contextOptions: {
		viewport: {
			width: 1280,
			height: 1024,
		},
	},
};
