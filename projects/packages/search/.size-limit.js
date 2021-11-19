module.exports = [
	{
		path: 'build/instant-search/jp-search-main.bundle.min.js',
		running: false,
		limit: '4 KiB',
	},
	{
		path: 'build/instant-search/jp-search.chunk-main-payload.*.min.js',
		running: false,
		limit: '50 KiB',
	},
];
