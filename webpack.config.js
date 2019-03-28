const path = require( 'path' );
const webpack = require( 'webpack' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );

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
		alias: {
			react: path.join( __dirname, '/node_modules/react' ),
		},
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
	],
	externals: {
		'react/addons': true,
		'react/lib/ExecutionEnvironment': true,
		'react/lib/ReactContext': true,
		jsdom: 'window',
	},
	devtool: devMode ? 'source-map' : false,
};

if ( ! devMode ) {
	// Create global process.env.NODE_ENV constant available at the browser window
	// eslint-disable-next-line no-new
	new webpack.DefinePlugin( {
		// This has effect on the react lib size
		// TODO switch depending on actual environment
		'process.env.NODE_ENV': JSON.stringify( process.env.NODE_ENV ),
	} );
}

module.exports = webpackConfig;
