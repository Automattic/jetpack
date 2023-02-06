module.exports = {
	extends: [ require.resolve( 'jetpack-js-tools/eslintrc/react' ) ],
	parserOptions: {
		babelOptions: {
			configFile: require.resolve( './babel.config.js' ),
		},
	},
	rules: {
		'jsdoc/check-tag-names': [ 1, { definedTags: [ 'jsx', 'jest-environment' ] } ],
		'react/jsx-no-bind': 0,

		// Enforce use of the correct textdomain.
		'@wordpress/i18n-text-domain': [
			'error',
			{
				allowedTextDomain: 'jetpack-search-pkg',
			},
		],
	},
	overrides: [
		{
			files: './src/customberg/**/*',
			rules: {
				// Customberg uses @wordpress/babel-preset-default, which auto-imports React as necessary.
				'react/react-in-jsx-scope': 0,
			},
		},
	],
};
