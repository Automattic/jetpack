module.exports = {
	extends: [ '../../../tools/js-tools/eslintrc/react.js' ],
	parserOptions: {
		babelOptions: {
			configFile: require.resolve( './babel.config.js' ),
		},
	},
	rules: {
		// Enforce the use of the jetpack-backup textdomain.
		'@wordpress/i18n-text-domain': [
			'error',
			{
				allowedTextDomain: 'jetpack-backup-pkg',
			},
		],
	},
};
