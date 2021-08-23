// @todo Remove this, use calypso-build instead. See https://github.com/Automattic/jetpack/pull/17571.
// That should also allow us to remove webpack from package.json.
const path = require( 'path' );
const packagesFolder = path.resolve( __dirname );
const buildFolder = path.resolve( __dirname, 'dist' );

module.exports = [
	{
		mode: 'production',
		context: packagesFolder,
		entry: {
			'lazy-images': './src/js/lazy-images.js',
			'intersection-observer': './node_modules/intersection-observer/intersection-observer.js',
		},
		output: {
			path: buildFolder,
			filename: '[name].min.js',
		},
		module: {
			rules: [
				{
					test: /\.js$/,
					exclude: /(node_modules|bower_components)/,
					use: {
						loader: 'babel-loader',
						options: {
							presets: [ '@babel/preset-env' ],
						},
					},
				},
			],
		},
	},
];
