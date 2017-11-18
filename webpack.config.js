require( 'es6-promise' ).polyfill();

var path = require( 'path' );
var webpack = require( 'webpack' );
var fs = require('fs');
var NODE_ENV = process.env.NODE_ENV || 'development';
var ExtractTextPlugin = require( 'extract-text-webpack-plugin' );

var IS_HOT_UPDATE = ( process.env.NODE_ENV !== 'production' );

// This file is written in ES5 because it is run via Node.js and is not transpiled by babel. We want to support various versions of node, so it is best to not use any ES6 features even if newer versions support ES6 features out of the box.
var webpackConfig = {

	// Entry points point to the javascript module that is used to generate the script file.
	// The key is used as the name of the script.
	entry: {
		admin: './_inc/client/admin.js',
		static: './_inc/client/static.jsx'
	},
	output: {
		path: path.join( __dirname, '_inc/build' ),
		filename: "[name].js"
	},
	module: {

		// Webpack loaders are applied when a resource is matches the test case
		rules: [
			{
				test: /\.jsx?$/,
				use: [
					// {
					// 	loader: 'eslint-loader',
					// 	query: {
					// 		configFile: path.join(__dirname, '.eslintrc'),
					// 		quiet: true
					// 	},
					// },
					{
						loader: 'babel-loader',
						options: {
							presets: ['es2015', 'stage-1', 'react'],
							plugins: [
								"transform-runtime",
								"add-module-exports",
								"transform-es3-member-expression-literals",
								"transform-export-extensions"
							]

						}
					},
				],

				// exclude: /node_modules/,
				// include both typical npm-linked locations and default module locations to handle both cases
				include: [
					path.join( __dirname, 'test' ),
					path.join( __dirname, '_inc/client' ),
				]
			},
			{
				test: /\.json$/,
				loader: 'json-loader'
			},
			{
				test: /\.css$/,
				use: ExtractTextPlugin.extract({
					fallback: "style-loader",
					use: [ "css-loader", "autoprefixer-loader" ]
				})
			},
			{
				test: /\.html$/,
				loader: 'html-loader'
			},
			{
				test: /\.scss$/,
				use: ExtractTextPlugin.extract({
				  fallback: "style-loader",
				  use: [ "css-loader", "sass-loader" ]
				})
			},
			{
				test: /\.svg/,
				loader: 'url-loader'
			}
		]
	},
	resolve: {
		extensions: [ '.js', '.jsx' ],
		alias: {
			"react": path.join(__dirname, "/node_modules/react")
		},
		modules: [
			path.resolve( __dirname, 'node_modules' ),
			path.resolve( __dirname, '_inc/client' ),
		]
	},
	resolveLoader: {
		modules: [ path.join( __dirname, 'node_modules' ) ]
	},
	node: {
		fs: "empty",
		process: true
	},
	plugins: [
		new webpack.DefinePlugin({

			// NODE_ENV is used inside React to enable/disable features that should only
			// be used in development
			'process.env.NODE_ENV': JSON.stringify( NODE_ENV )
		}),
		new ExtractTextPlugin( '[name].dops-style.css' ),
		// new webpack.optimize.UglifyJsPlugin(),
	],
	externals: {
		'react/addons': true,
		'react/lib/ExecutionEnvironment': true,
		'react/lib/ReactContext': true,
		jsdom: 'window'
	}
};

if ( NODE_ENV === 'production' ) {

	new webpack.DefinePlugin( {
		// This has effect on the react lib size
		'process.env.NODE_ENV': JSON.stringify( process.env.NODE_ENV ) // TODO switch depending on actual environment
	} );
}

module.exports = webpackConfig;
