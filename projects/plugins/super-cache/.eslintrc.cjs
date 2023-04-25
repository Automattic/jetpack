module.exports = {
	extends: [ require.resolve( 'jetpack-js-tools/eslintrc/base' ) ],
	rules: {
		// Enforce use of the correct textdomain.
		'@wordpress/i18n-text-domain': [
			'error',
			{
				allowedTextDomain: 'wp-super-cache',
			},
		],
	},
};
