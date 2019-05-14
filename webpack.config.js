const path = require( 'path' );
const webpack = require( 'webpack' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
const StaticSiteGeneratorPlugin = require( 'static-site-generator-webpack-plugin' );
const WordPressExternalDependenciesPlugin = require( '@automattic/wordpress-external-dependencies-plugin' );

const NODE_ENV = process.env.NODE_ENV || 'development';
const devMode = process.env.NODE_ENV !== 'production';

const webpackConfig = {
	mode: devMode ? 'development' : 'production',
	// Entry points point to the javascript module
	// that is used to generate the script file.
	// The key is used as the name of the script.
	entry: {
		admin: path.join( __dirname, './_inc/client/admin.js' ),
		static: path.join( __dirname, './_inc/client/static.jsx' ),
	},
	output: {
		path: path.join( __dirname, '_inc/build' ),
		filename: '[name].js',
		library: [ 'Jetpack', '[name]' ],
		libraryTarget: 'umd',
		globalObject: 'this',
	},
	module: {
		// Webpack loaders are applied when a resource is matches the test case
		rules: [
			{
				test: /\.jsx?$/,
				loader: 'babel-loader',
				// include both typical npm-linked locations and default module
				// locations to handle both cases
				include: [ path.join( __dirname, 'test' ), path.join( __dirname, '_inc/client' ) ],
			},
			{
				test: /\.css$/,
				use: [ { loader: MiniCssExtractPlugin.loader }, 'css-loader', 'autoprefixer-loader' ],
			},
			{
				test: /\.html$/,
				loader: 'html-loader',
			},
			{
				test: /\.scss$/,
				use: [ { loader: MiniCssExtractPlugin.loader }, 'css-loader', 'sass-loader' ],
			},
			{
				test: /\.svg/,
				loader: 'url-loader',
			},
		],
	},
	resolve: {
		extensions: [ '.js', '.jsx' ],
		modules: [
			path.resolve( __dirname, 'node_modules' ),
			path.resolve( __dirname, '_inc/client' ),
		],
	},
	resolveLoader: {
		modules: [ path.join( __dirname, 'node_modules' ) ],
	},
	node: {
		fs: 'empty',
		process: true,
	},
	plugins: [
		new webpack.DefinePlugin( {
			// NODE_ENV is used inside React to enable/disable features that should
			// only be used in development
			'process.env.NODE_ENV': JSON.stringify( NODE_ENV ),
		} ),
		new MiniCssExtractPlugin( {
			// Options similar to the same options in webpackOptions.output
			// both options are optional
			filename: '[name].dops-style.css',
		} ),
		new WordPressExternalDependenciesPlugin(),
		// new HtmlWebpackPlugin( {
		// 	template: '!!prerender-loader?string!_inc/client/static.html',
		// 	filename: 'static.html',
		// 	inject: false,
		// } ),
		// new HtmlWebpackPlugin( {
		// 	template: '!!prerender-loader?string!_inc/client/static-noscript-notice.html',
		// 	filename: 'static-noscript-notice.html',
		// 	inject: false,
		// } ),
		// new HtmlWebpackPlugin( {
		// 	template: '!!prerender-loader?string!_inc/client/static-version-notice.html',
		// 	filename: 'static-version-notice.html',
		// 	inject: false,
		// } ),
		new StaticSiteGeneratorPlugin( {
			entry: 'static',
			paths: [ '/static.html' /* '/static-noscript-notice.html', '/static-version-notice.html' */ ],
		} ),
	],
	devtool: devMode ? 'source-map' : false,
};

module.exports = webpackConfig;
