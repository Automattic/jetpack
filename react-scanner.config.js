module.exports = {
	// Crawl the entire repo
	crawlFrom: './',
	// Needed for properly reporting components with dot notation
	includeSubComponents: true,
	// Exclude usage in tests and stories.
	globs: [ '**/!(test|stories)/!(*stories).@(js|ts)?(x)' ],
	// Exclude any vendor or docs directories
	exclude: [ 'docs', 'jetpack_vendor', 'node_modules', 'tools', 'vendor' ],
	// Consider only imports of `@wordpress/components`
	importedFrom: '@wordpress/components',
	// Full usage report
	processors: [ [ 'raw-report', { outputTo: './results/jetpack.json' } ] ],
};
