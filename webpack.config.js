require( 'es6-promise' ).polyfill();

var path = require( 'path' );
var webpack = require( 'webpack' );
var NODE_ENV = process.env.NODE_ENV || 'development';
var ExtractTextPlugin = require( 'extract-text-webpack-plugin' );


// This file is written in ES5 because it is run via Node.js and is not transpiled by babel. We want to support various versions of node, so it is best to not use any ES6 features even if newer versions support ES6 features out of the box.
var webpackConfig = {

	// Entry points point to the javascript module that is used to generate the script file.
	// The key is used as the name of the script.
	entry: {
		admin: './_inc/client/admin.js'
	},
	output: {
		path: path.join( __dirname, '_inc/build' ),
		filename: "[name].js"
	},
	devtool: '#source-map',
	module: {

		// Webpack loaders are applied when a resource is matches the test case
		loaders: [
			{
				test: /\.jsx?$/,
				exclude: /node_modules/,
				loaders: [ 'babel-loader?cacheDirectory&optional[]=runtime' ]
			},
			{
				test: /\.scss$/,
				loader: ExtractTextPlugin.extract( 'style-loader', 'css!sass' )
			}
		]
	},
	resolve: {
		extensions: [ '', '.js', '.jsx' ],
		modulesDirectories: [ 'node_modules', 'client' ]
	},
	node: {
		fs: "empty",
		process: true
	},
	eslint: {
		configFile: path.join(__dirname, '.eslintrc'),
		quiet: true
	},

	plugins: [
		new webpack.DefinePlugin({

			// NODE_ENV is used inside React to enable/disable features that should only
			// be used in development
			'process.env': {
				NODE_ENV: JSON.stringify( NODE_ENV )
			}
		}),
		new ExtractTextPlugin( 'style.css' )
	]
};

if ( NODE_ENV === 'production' ) {

	webpack.DefinePlugin( {
		"process.env": {
			// This has effect on the react lib size
			"NODE_ENV": JSON.stringify(process.env.NODE_ENV) // TODO switch depending on actual environment
		}
	} );
}

module.exports = webpackConfig;