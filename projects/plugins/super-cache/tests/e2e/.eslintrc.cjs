module.exports = {
	root: true,
	extends: [
		require.resolve( 'jetpack-js-tools/eslintrc/base' ),
		require.resolve( 'jetpack-js-tools/eslintrc/wp-eslint-plugin/recommended' ),
	],
	parserOptions: {
		sourceType: 'module',
		tsconfigRootDir: __dirname,
		project: [ './tsconfig.json' ],
	},
	rules: {
		'comma-dangle': 0,
		'jsdoc/no-undefined-types': [
			1,
			{
				definedTypes: [ 'TemplateVars', 'ErrorSet', 'Readable' ],
			},
		],
		'prettier/prettier': 0,
	},
};
