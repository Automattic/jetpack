const loadIgnorePatterns = require( 'jetpack-js-tools/load-eslint-ignore.js' );

// .eslintrc.js
module.exports = {
	root: true,
	extends: [
		require.resolve( 'jetpack-js-tools/eslintrc/wp-eslint-plugin/esnext' ),
		require.resolve( 'jetpack-js-tools/eslintrc/playwright' ),
		require.resolve( 'jetpack-js-tools/eslintrc/prettier' ),
	],
	ignorePatterns: loadIgnorePatterns( __dirname ),
	parserOptions: {
		requireConfigFile: false,
	},
	env: {
		node: true,
	},
	globals: {
		wp: true,
		jpConnect: true,
	},
	rules: {
		'no-console': 0,
		'playwright/no-skipped-test': 0,
	},
};
