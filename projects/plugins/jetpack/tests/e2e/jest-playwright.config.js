/**
 * For a detailed explanation of configuration properties, visit:
 * https://playwright.dev/docs/api/class-browsertype?_highlight=launch#browsertypelaunchoptions
 */

const { CI, E2E_DEBUG, HEADLESS, SLOWMO } = process.env;
let executablePath = '';

if ( ! CI ) {
	executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
}

module.exports = {
	exitOnPageError: false,
	launchOptions: {
		headless: HEADLESS !== 'false',
		devtools: HEADLESS === 'false',
		slowMo: parseInt( SLOWMO, 10 ) || 0,
		logger: {
			isEnabled: ( name, severity ) => {
				let bool = false;
				if ( name !== 'protocol' ) {
					console.log( 'ZZZZZZZZ', name, severity );
					bool = true;
				}
				return bool;
			},
			log: ( name, severity, message, args ) => console.log( `!!!!!!  ${ name } ${ message }` ),
		},
	},
	contextOptions: {
		viewport: {
			width: 1280,
			height: 1024,
		},
	},
};
