module.exports = {
	root: true,
	extends: [ require.resolve( 'jetpack-js-tools/eslintrc/wp-eslint-plugin/recommended' ) ],
	plugins: [ 'jest', '@typescript-eslint' ],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		sourceType: 'module',
		tsconfigRootDir: __dirname,
	},
	rules: {
		'comma-dangle': 0,
		'prettier/prettier': 0,
		'@typescript-eslint/no-unused-vars': 0,
	},
};
