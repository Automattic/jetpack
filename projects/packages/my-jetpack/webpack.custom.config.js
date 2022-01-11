/**
 * External dependencies
 */
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

const resolve = {
	extensions: [ '.js', '.jsx', '.ts', '.tsx', '...' ],
};

module.exports = {
	...defaultConfig,
	resolve,
};

