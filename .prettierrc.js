module.exports = {
	// Load plugins from sub-project so we don't have to clutter the monorepo root with them.
	plugins: require( './tools/js-tools/prettier-plugins.js' ),

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
};
