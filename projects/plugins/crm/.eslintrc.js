module.exports = {
	extends: [ require.resolve( 'jetpack-js-tools/eslintrc/react' ) ],
	rules: {
		// Enforce the use of the zero-bs-crm textdomain.
		'@wordpress/i18n-text-domain': [
			'error',
			{
				allowedTextDomain: 'zero-bs-crm',
			},
		],
		'jsdoc/require-jsdoc': 'off',
	},
};
