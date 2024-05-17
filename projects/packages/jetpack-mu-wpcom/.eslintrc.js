module.exports = {
	extends: [ require.resolve( 'jetpack-js-tools/eslintrc/react' ) ],
	parserOptions: {
		requireConfigFile: false,
		babelOptions: {
			configFile: require.resolve( './babel.config.js' ),
		},
	},
	rules: {
		'jsdoc/require-returns': 0,
		'@wordpress/i18n-text-domain': [
			'error',
			{
				allowedTextDomain: 'jetpack-mu-wpcom',
			},
		],
		'testing-library/prefer-screen-queries': 'off',
		'react/jsx-no-bind': 'off',
		// Not needed for TypeScript.
		'jsdoc/require-param-type': 'off',
		'jsdoc/require-returns-type': 'off',
	},
};
