const path = require( 'path' );
const postcssPlugins = require( '@wordpress/postcss-plugins-preset' );
const projects = require( './projects' );

const includePaths = [ path.resolve( __dirname ) ].concat( projects );

module.exports = ( { config } ) => {
	config.devtool = false;
	config.module.rules.push(
		{
			test: /\/stories\/.+\.[jt]sx$/,
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
