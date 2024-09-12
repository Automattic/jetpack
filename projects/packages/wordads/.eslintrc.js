module.exports = {
	extends: [ require.resolve( 'jetpack-js-tools/eslintrc/react' ) ],
	rules: {
		'jsdoc/check-tag-names': [ 1, { definedTags: [ 'jsx', 'jest-environment' ] } ],
		'react/jsx-no-bind': 0,

		// Enforce use of the correct textdomain.
		'@wordpress/i18n-text-domain': [
			'error',
			{
				allowedTextDomain: 'jetpack-wordads',
			},
		],
	},
};
