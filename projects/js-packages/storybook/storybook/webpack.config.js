/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * WordPress dependencies
 */
const postcssPlugins = require( '@wordpress/postcss-plugins-preset' );

const includePaths = [
	path.resolve( __dirname ),
	path.join( __dirname, '../../base-styles/stories' ),
	path.join( __dirname, '../../components/components' ),
	path.join( __dirname, '../../connection/components' ),
	path.join( __dirname, '../../idc/components' ),
];

module.exports = ( { config } ) => {
	config.module.rules.push(
		{
			test: /\/stories\/.+\.jsx$/,
			loader: require.resolve( '@storybook/source-loader' ),
			enforce: 'pre',
		},
		{
			test: /\.scss$/,
			use: [
				'style-loader',
				'css-loader',
				{
					loader: 'postcss-loader',
					options: {
						postcssOptions: {
							ident: 'postcss',
							plugins: postcssPlugins,
						},
					},
				},
				'sass-loader',
			],
			include: includePaths,
		}
	);

	return config;
};
