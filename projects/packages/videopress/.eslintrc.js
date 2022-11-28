/**
 * @type {import("eslint").Linter.Config}
 */
module.exports = {
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
