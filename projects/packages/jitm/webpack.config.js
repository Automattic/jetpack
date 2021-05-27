// @todo Remove this, use calypso-build instead. See https://github.com/Automattic/jetpack/pull/17571.
// That should also allow us to remove webpack from package.json.
const path = require( 'path' );
const packagesFolder = path.resolve( __dirname, 'src/js' );

module.exports = [
	{
		mode: 'production',
		context: packagesFolder,
		entry: './jetpack-jitm.js',
		output: {
			path: packagesFolder,
			filename: 'jetpack-jitm.min.js',
		},
	},
];
