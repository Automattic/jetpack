// webpack.common.cjs
const { CleanWebpackPlugin } = require( 'clean-webpack-plugin' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );

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
const getCommonConfig = isESM => {
	// Only clean main index files in root directory for the main bundle
	const cleanPatterns = [ isESM ? 'index.mjs' : 'index.js', '!index.d.ts' ];

	// For component builds, add their specific patterns
	components.forEach( component => {
		cleanPatterns.push(
			`${ component }/index${ isESM ? '.js' : '.cjs.js' }`,
			`!${ component }/index.d.ts`
		);
	} );

	return {
		module: {
			rules: [
				{
					test: /\.(ts|tsx)$/,
					use: [
						{
							loader: 'babel-loader',
							options: {
								presets: [ '@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript' ],
								plugins: [ [ '@babel/plugin-transform-runtime', { useESModules: isESM } ] ],
							},
						},
					],
					exclude: /node_modules/,
				},
				{
					test: /\.(scss|css)$/,
					use: [
						MiniCssExtractPlugin.loader,
						{
							loader: 'css-loader',
							options: {
								modules: {
									localIdentName: '[name]__[local]__[hash:base64:5]',
								},
								importLoaders: 2,
							},
						},
						'postcss-loader',
						'sass-loader',
					],
				},
			],
		},
		resolve: {
			extensions: [ '.tsx', '.ts', '.js', '.jsx' ],
		},
		externals: [ 'react', 'react-dom', /^@visx\/.*/, '@react-spring/web', 'clsx', 'tslib' ],
		plugins: [
			new CleanWebpackPlugin( {
				cleanOnceBeforeBuildPatterns: cleanPatterns,
				cleanAfterEveryBuildPatterns: [],
				cleanStaleWebpackAssets: false,
				verbose: true,
			} ),
			new MiniCssExtractPlugin( {
				filename: pathData => {
					const name = pathData.chunk.name;
					if ( name === 'index' ) {
						return 'style.css';
					}
					return `${ name }/style.css`;
				},
			} ),
		],
		optimization: {},
	};
};

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

module.exports = { getCommonConfig, getComponentEntries };
