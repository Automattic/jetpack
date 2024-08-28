module.exports = {
	rules: {
		'jsdoc/check-tag-names': [ 1, { definedTags: [ 'jest-environment' ] } ],
		// Enforce use of the correct textdomain.
		'@wordpress/i18n-text-domain': [
			'error',
			{
				allowedTextDomain: 'jetpack-blaze',
			},
		],
	},
};
