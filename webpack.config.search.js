const path = require( 'path' );

module.exports = {
	entry: path.join( __dirname, '_inc/search/src/index.js' ),
	output: {
		path: path.resolve( __dirname, '_inc/search/dist' ),
		filename: 'jp-search.bundle.js',
	},
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
				},
			},
		],
	},
};
