const path = require( 'path' );
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

module.exports = {
	...defaultConfig,
	entry: {
		index: path.resolve( __dirname, 'src/index.tsx' ),
	},
	resolve: {
		...defaultConfig.resolve,
		alias: {
			...( defaultConfig.resolve?.alias || {} ),
			'@': path.resolve( __dirname, 'src' ),
		},
		extensions: [ '.ts', '.tsx', '.js', '.jsx', ...( defaultConfig.resolve?.extensions || [] ) ],
	},
};
