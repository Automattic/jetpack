module.exports = ( api, opts ) => {
	return {
		presets: [ require.resolve( '@wordpress/babel-preset-default' ) ],
		plugins: [],
	};
};
