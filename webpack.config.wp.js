const CopyWebpackPlugin = require( 'copy-webpack-plugin' );
const getBaseWebpackConfig = require( '@automattic/calypso-build/webpack.config.js' );

function getWebpackConfig( env, argv ) {
	return getBaseWebpackConfig( env, argv );
}

module.exports = getWebpackConfig;
