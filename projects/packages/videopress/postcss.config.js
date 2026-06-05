const { webpackPostcssPlugins } = require( '@automattic/jetpack-webpack-config/postcss' );

module.exports = () => ( {
	plugins: webpackPostcssPlugins( { fromDir: __dirname } ),
} );
