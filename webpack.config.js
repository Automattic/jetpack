require( 'es6-promise' ).polyfill();

var path = require( 'path' );
var webpack = require( 'webpack' );
var fs = require('fs');
var ExtractTextPlugin = require( 'extract-text-webpack-plugin' );

var NODE_ENV = ( process.env.NODE_ENV || 'development' );
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
				test: /\.html/,
				loader: 'html-loader'
			},
			{
				test: /\.jsx?$/,
				loader: 'eslint-loader',
				enforce: 'pre',
				exclude: /node_modules/,
				options: {
					configFile: '.eslintrc',
					failOnError: false,
				}
			},
			{
				test: /\.jsx?$/,
				loader: 'babel-loader',

				// include both typical npm-linked locations and default module locations to handle both cases
				include: [
					path.join( __dirname, 'test' ),
					path.join( __dirname, '_inc/client' ),
					fs.realpathSync( path.join( __dirname, './node_modules/@automattic/dops-components/client' ) ),
					path.join( __dirname, './node_modules/@automattic/dops-components/client' )
				]
			},
			{
				test: /\.css$/,
				loader: ExtractTextPlugin.extract( {
					use: [ 'css-loader?sourceMap!autoprefixer!' ]
				} )
			},
			{
				test: /\.scss$/,
				use: [{
					loader: "style-loader"
				}, {
					loader: "css-loader"
				}, {
					loader: "sass-loader"
				}]
			}
		]
	},
	resolve: {
		extensions: [ '.js', '.jsx' ],
		alias: {
			"react": path.join(__dirname, "/node_modules/react")
		},
		modules: [
			path.resolve( __dirname, '_inc/client' ),
			fs.realpathSync( path.join(__dirname, 'node_modules/@automattic/dops-components/client') ),
			'node_modules'
		]
	},
	resolveLoader: {
		modules: [
			path.join( __dirname, 'node_modules' )
		]
	},
	node: {
		fs: "empty",
		process: true
	},
	plugins: [
		new webpack.LoaderOptionsPlugin({
			minimize: true,
			debug: false
		}),
		new webpack.DefinePlugin({
			// NODE_ENV is used inside React to enable/disable features that should only
			// be used in development
			'process.env': {
				NODE_ENV: JSON.stringify( NODE_ENV )
			}
		}),
		new ExtractTextPlugin( '[name].dops-style.css' )
	],
	externals: {
		'react/addons': true,
		'react/lib/ExecutionEnvironment': true,
		'react/lib/ReactContext': true,
		jsdom: 'window'
	}
};

module.exports = webpackConfig;
