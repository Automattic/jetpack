/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * WordPress dependencies
 */
const postcssPlugins = require( '@wordpress/postcss-plugins-preset' );



module.exports = ( { config } ) => {
	// console.warn("excluding", path.resolve( path.join( __dirname, '../node_modules' ) ));
	// process.exit(0);
	// console.warn("c")
	config.module.rules.push(
		{
			test: /\/stories\/.+\.js$/,
			loaders: [ require.resolve( '@storybook/source-loader' ) ],
			enforce: 'pre',
			// include: path.resolve( path.join( __dirname, 'storybook' ) ),
			exclude: /node_modules/,
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
			include: path.resolve( path.join( __dirname, 'storybook' ) ),
			exclude: /node_modules/,
		}
	);

	console.warn(config.module.rules);

	process.exit(0);

	return config;
};
