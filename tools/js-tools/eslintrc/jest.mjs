import eslintPluginJest from 'eslint-plugin-jest';
import eslintPluginJestDom from 'eslint-plugin-jest-dom';
import eslintPluginTestingLibrary from 'eslint-plugin-testing-library';
import globals from 'globals';

export default [
	eslintPluginJest.configs[ 'flat/recommended' ],
	eslintPluginJest.configs[ 'flat/style' ],
	eslintPluginJestDom.configs[ 'flat/recommended' ],
	eslintPluginTestingLibrary.configs[ 'flat/react' ],
	{
		name: 'Monorepo jest config',
		languageOptions: {
			globals: {
				...globals.jest,
				...globals.node,
			},
		},
		rules: {
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
	},
];
