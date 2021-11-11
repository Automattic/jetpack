module.exports = {
	root: true,
	extends: [ 'plugin:@wordpress/eslint-plugin/recommended', 'plugin:playwright/playwright-test' ],
	globals: {
		jpConnect: true,
	},
	rules: {
		'arrow-parens': [ 0, 'as-needed' ],
		'no-console': 0,
		'jsdoc/check-tag-names': [ 'error', { definedTags: [ 'group' ] } ],
		'jest/no-done-callback': 0,
		'jest/no-disabled-tests': 0,
	},
};
