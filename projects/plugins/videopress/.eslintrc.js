module.exports = {
	extends: [ require.resolve( 'jetpack-js-tools/eslintrc/react' ) ],
	rules: {
		// Enforce the use of the jetpack-videopress textdomain.
		'@wordpress/i18n-text-domain': [
			'error',
			{
				allowedTextDomain: 'jetpack-videopress',
			},
		],
	},
};
