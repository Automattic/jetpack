const loadIgnorePatterns = require( '../../../../../tools/js-tools/load-eslint-ignore.js' );

// For local development, detect when `pnpm install` has not been run in the E2E workspace and
// return a "disabled" config to avoid errors.
let disable = false;
if ( ! process.env.CI ) {
	try {
		require.resolve( 'jetpack-e2e-commons/.eslintrc.cjs' );
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
		extends: [ require.resolve( 'jetpack-e2e-commons/.eslintrc.cjs' ) ],
		ignorePatterns: loadIgnorePatterns( __dirname ),
	};
}
