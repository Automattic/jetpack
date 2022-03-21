module.exports = {
	extends: [ '../../../tools/js-tools/eslintrc/react.js' ],
	parserOptions: {
		requireConfigFile: false,
		babelOptions: {
			presets: [ require.resolve( '@babel/preset-react' ) ],
		},
	},
	rules: {
		// Enforce use of the correct textdomain.
		'@wordpress/i18n-text-domain': [
			'error',
			{
				// @todo: Change this to something not "jetpack".
				allowedTextDomain: 'jetpack',
			},
		],
	},
};
