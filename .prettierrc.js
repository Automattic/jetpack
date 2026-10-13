module.exports = {
	useTabs: true,
	tabWidth: 2,
	printWidth: 100,
	singleQuote: true,
	trailingComma: 'es5',
	bracketSpacing: true,
	parenSpacing: true,
	bracketSameLine: false,
	semi: true,
	arrowParens: 'avoid',

	// prettier adds trailing commas to jsonc files, which `@eslint/json` then chokes on.
	// Besides which, most of our "jsonc" files are really "strip out lines beginning with `//` then json_decode".
	overrides: [
		{
			files: '*.jsonc',
			options: {
				trailingComma: 'none',
			},
		},
	],
};
