// eslint-disable-next-line import/no-extraneous-dependencies
const loadIgnorePatterns = require( 'jetpack-js-tools/load-eslint-ignore.js' );

module.exports = {
	root: true,
	extends: [
		require.resolve( 'jetpack-js-tools/eslintrc/base' ),
		require.resolve( 'jetpack-js-tools/eslintrc/wp-eslint-plugin/recommended' ),
	],
	ignorePatterns: loadIgnorePatterns( __dirname ),
	parserOptions: {
		sourceType: 'module',
		tsconfigRootDir: __dirname,
		project: [ './tsconfig.json' ],
	},
	rules: {
		'comma-dangle': 0,
		'prettier/prettier': 0,
		'@typescript-eslint/no-unused-vars': 0,
		'import/no-unresolved': 0,
	},
};
