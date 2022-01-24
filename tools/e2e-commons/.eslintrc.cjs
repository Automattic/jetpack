const loadIgnorePatterns = require( '../../tools/js-tools/load-eslint-ignore.js' );

// For local development, detect when `pnpm install` has not been run in the E2E workspace and
// return a "disabled" config to avoid errors.
let disable = false;
if ( ! process.env.CI ) {
	try {
		require.resolve( 'eslint-plugin-playwright' );
	} catch ( e ) {
		disable = true;
	}
}
if ( disable ) {
	const s = `Disabling eslint in ${ __dirname } because \`pnpm install\` has not been run there.`;
	console.warn( '-'.repeat( s.length ) );
	console.warn( s );
	console.warn( '-'.repeat( s.length ) );
	module.exports = {
		root: true,
		parser: '@babel/eslint-parser',
		parserOptions: {
			requireConfigFile: false,
		},
		ignorePatterns: loadIgnorePatterns( __dirname ),
		rules: {},
	};
} else {
	module.exports = {
		root: true,
		extends: [ 'plugin:@wordpress/eslint-plugin/recommended', 'plugin:playwright/playwright-test' ],
		ignorePatterns: loadIgnorePatterns( __dirname ),
		parserOptions: {
			requireConfigFile: false,
		},
		globals: {
			wp: true,
			jpConnect: true,
		},
		rules: {
			'arrow-parens': [ 0, 'as-needed' ],
			'no-console': 0,
			'jest/no-done-callback': 0,
			'jest/no-disabled-tests': 0,
		},
	};
}
