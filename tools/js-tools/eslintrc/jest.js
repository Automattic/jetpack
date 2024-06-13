/**
 * @type {import("eslint").Linter.Config}
 */
module.exports = {
	extends: [
		'./preload',
		'plugin:jest/recommended',
		'plugin:jest/style',
		'plugin:jest-dom/recommended',
		'plugin:testing-library/react',
	],
	env: { jest: true },
	rules: {
		'jest/no-disabled-tests': 'off',
		'jest/prefer-comparison-matcher': 'error',
		'jest/prefer-equality-matcher': 'error',
		'jest/prefer-expect-resolves': 'error',
		'jest/prefer-hooks-in-order': 'warn',
		'jest/prefer-hooks-on-top': 'warn',
		'jest/prefer-snapshot-hint': [ 'warn', 'always' ],
		'jest/prefer-spy-on': 'warn',
		'jest/prefer-todo': 'error',
		'testing-library/prefer-explicit-assert': 'error',
		'testing-library/prefer-user-event': 'warn',
	},
};
