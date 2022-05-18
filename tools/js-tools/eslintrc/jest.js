/**
 * @type {import("eslint").Linter.Config}
 */
module.exports = {
	extends: [ './base', 'plugin:jest/recommended' ],
	env: { jest: true },
	rules: {
		'jsdoc/check-tag-names': [
			1, // Recommended
			{ definedTags: [ 'jest-environment' ] },
		],
	},
};
