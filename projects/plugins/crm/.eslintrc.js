module.exports = {
	rules: {
		// Enforce the use of the jetpack-starter-plugin textdomain.
		'@wordpress/i18n-text-domain': [
			'error',
			{
				allowedTextDomain: 'zero-bs-crm',
			},
		],
	},
};
