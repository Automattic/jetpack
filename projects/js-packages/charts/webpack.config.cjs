const path = require( 'path' );
const { CleanWebpackPlugin } = require( 'clean-webpack-plugin' );
const ForkTsCheckerWebpackPlugin = require( 'fork-ts-checker-webpack-plugin' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
const TsconfigPathsPlugin = require( 'tsconfig-paths-webpack-plugin' );

// List of components to build individually
const components = [
	'components/bar-chart',
	'components/line-chart',
	'components/pie-chart',
	'components/pie-semi-circle-chart',
	'components/tooltip',
	'components/legend',
	'components/grid-control',
	'providers/theme',
];

// Common configuration for both ESM and CommonJS builds
const getCommonConfig = isESM => ( {
	module: {
		rules: [
			{
				test: /\.(ts|tsx)$/,
				use: [
					{
						loader: 'babel-loader',
						options: {
							presets: [
								'@babel/preset-env',
								[
									'@babel/preset-react',
									{
										runtime: 'automatic',
									},
								],
								'@babel/preset-typescript',
							],
							plugins: [ [ '@babel/plugin-transform-runtime', { useESModules: isESM } ] ],
						},
					},
				],
				exclude: /node_modules/,
			},
			{
				test: /\.(scss|css)$/,
				use: [ MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', 'sass-loader' ],
			},
		],
	},
	resolve: {
		extensions: [ '.tsx', '.ts', '.js', '.jsx' ],
		plugins: [ new TsconfigPathsPlugin() ],
	},
	externals: [
		'react',
		'react-dom',
		/^@visx\/.*/,
		'@react-spring/web',
		'clsx',
		'tslib',
		'@babel/runtime',
	],
	plugins: [
		new CleanWebpackPlugin(),
		new MiniCssExtractPlugin( {
			filename: pathData => {
				const name = pathData.chunk.name;
				if ( name === 'index' ) {
					return 'style.css';
				}
				return `${ name }/style.css`;
			},
		} ),
		new ForkTsCheckerWebpackPlugin( {
			typescript: {
				configFile: './tsconfig.json',
				mode: 'write-dts',
			},
		} ),
	],
} );

// Generate entry points for components
const getComponentEntries = () => {
	const entries = {
		index: './src/index.ts',
	};

	components.forEach( component => {
		entries[ component ] = `./src/${ component }/index`;
	} );

	return entries;
};

const cjsConfig = {
	...getCommonConfig( false ),
	entry: getComponentEntries(),
	output: {
		path: path.resolve( './', 'dist/cjs' ),
		filename: pathData => {
			const name = pathData.chunk.name;
			if ( name === 'index' ) {
				return 'index.js';
			}
			return `${ name }/index.js`;
		},
		library: {
			type: 'commonjs2',
		},
	},
	devtool: 'source-map',
};

const mjsConfig = {
	...getCommonConfig( true ),
	entry: getComponentEntries(),
	output: {
		path: path.resolve( './', 'dist/mjs' ),
		filename: pathData => {
			const name = pathData.chunk.name;
			if ( name === 'index' ) {
				return 'index.js';
			}
			return `${ name }/index.js`;
		},
		library: {
			type: 'module',
		},
		environment: {
			module: true,
		},
	},
	experiments: {
		outputModule: true,
	},
	devtool: 'source-map',
};

module.exports = [ cjsConfig, mjsConfig ];
