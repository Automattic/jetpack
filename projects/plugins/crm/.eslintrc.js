// eslint-disable-next-line import/no-extraneous-dependencies
const loadIgnorePatterns = require( 'jetpack-js-tools/load-eslint-ignore.js' );

module.exports = {
	root: true,
	extends: [
		require.resolve( 'jetpack-js-tools/eslintrc/base' ),
		require.resolve( 'jetpack-js-tools/eslintrc/wp-eslint-plugin/recommended' ),
	],
	ignorePatterns: loadIgnorePatterns( __dirname ),
	rules: {
		camelcase: 0,
		'no-var': 0,
		'prefer-const': 0,
		'prettier/prettier': 0,
		// This is not a react project.
		'react-hooks/rules-of-hooks': 0,

		// Don't require JSDoc on functions initially.
		'jsdoc/check-tag-names': 0,
		'jsdoc/require-jsdoc': 0,
		'jsdoc/require-returns': 0,
		'jsdoc/require-description': 0,
		'jsdoc/require-property-description': 0,
		'jsdoc/require-param-description': 0,
		'jsdoc/require-param-type': 0,
	},
};
