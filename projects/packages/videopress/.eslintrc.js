/**
 * @type {import("eslint").Linter.Config}
 */
module.exports = {
	// @todo: Uncomment this:
	// extends: [ require.resolve( 'jetpack-js-tools/eslintrc/react' ) ],
	rules: {
		// Enforce use of the correct textdomain.
		'@wordpress/i18n-text-domain': [
			'error',
			{
				allowedTextDomain: 'jetpack-videopress-pkg',
			},
		],
	},
};
