module.exports = {
	parserOptions: {
		babelOptions: {
			configFile: require.resolve( './babel.config.js' ),
		},
	},
	rules: {
		'jsdoc/check-tag-names': [ 1, { definedTags: [ 'jest-environment' ] } ],
		// Enforce use of the correct textdomain.
		'@wordpress/i18n-text-domain': [
			'error',
			{
				allowedTextDomain: 'jetpack-yoast-promo',
			},
		],
	},
};
