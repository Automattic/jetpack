module.exports = {
	extends: [ require.resolve( 'jetpack-js-tools/eslintrc/react' ) ],
	rules: {
		// Enforce the use of the classic-theme-helper-plugin textdomain.
		'@wordpress/i18n-text-domain': [
			'error',
			{
				allowedTextDomain: 'classic-theme-helper-plugin',
			},
		],
	},
};
