module.exports = [
	{
		path: 'build/instant-search/jp-search.js',
		limit: '4 KiB',
	},
	{
		path: 'build/instant-search/jp-search.chunk-main-payload.js',
		limit: '50 KiB',
	},
	// The shared search-blocks store ships once as the `jetpack-search/store`
	// Script Module. `results-list.js` is a pure store importer — if the
	// externalization regresses and the store gets inlined again, it balloons
	// from ~1 KB back past 40 KB and trips this limit.
	{
		path: 'build/search-blocks/store/index.js',
		limit: '60 KiB',
	},
	{
		path: 'build/search-blocks/results-list.js',
		limit: '3 KiB',
	},
];
