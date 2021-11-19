// .eslintrc.js
module.exports = {
	root: true,
	extends: [ 'plugin:@wordpress/eslint-plugin/recommended', 'plugin:jest/recommended' ],
	env: {
		jest: true,
		browser: true,
	},
	globals: {
		browser: true,
		page: true,
		wp: true,
		context: true,
		reporter: true,
		jpConnect: true,
		siteUrl: true,
		allure: true,
	},
	settings: {
		jest: {
			version: 26,
		},
	},
	rules: {
		'arrow-parens': [ 0, 'as-needed' ],
		'no-console': 0,
		'jsdoc/check-tag-names': [ 'error', { definedTags: [ 'group' ] } ],
		'jest/no-disabled-tests': 0,
	},
};
