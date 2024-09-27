module.exports = {
	rules: {
		// Enforce use of the correct textdomain.
		'@wordpress/i18n-text-domain': [
			'error',
			{
				allowedTextDomain: 'wpcomsh',
			},
		],

		'jest/no-disabled-tests': 'warn',
	},
};
