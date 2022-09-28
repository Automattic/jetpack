module.exports = {
	root: true,
	extends: [
		//require.resolve( 'jetpack-js-tools/eslintrc/base' ),
		require.resolve( 'jetpack-js-tools/eslintrc/wp-eslint-plugin/recommended' ),
	],
	parserOptions: {
		sourceType: 'module',
		tsconfigRootDir: __dirname,
		project: [ './tsconfig.json' ],
	},
	rules: {
		'comma-dangle': 0,
		'prettier/prettier': 0,
		'@typescript-eslint/no-unused-vars': 0,
	},
};
