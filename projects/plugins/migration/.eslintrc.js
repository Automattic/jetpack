module.exports = {
	extends: [ require.resolve( 'jetpack-js-tools/eslintrc/react' ) ],
	parserOptions: {
		babelOptions: {
			configFile: require.resolve( './babel.config.js' ),
		},
	},
	rules: {
		// Enforce the use of the wpcom-migration textdomain.
		'@wordpress/i18n-text-domain': [
			'error',
			{
				allowedTextDomain: 'wpcom-migration',
			},
		],
	},
};
