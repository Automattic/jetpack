// @todo Remove this, use calypso-build instead. See https://github.com/Automattic/jetpack/pull/17571.
// That should also allow us to remove webpack from the monorepo-level package.json.
const path = require( 'path' );
const packagesFolder = path.resolve( path.dirname( __dirname ), 'projects/packages/lazy-images/src/js' );

module.exports = [
	{
		mode: 'production',
		context: packagesFolder,
		entry: './lazy-images.js',
		output: {
			path: packagesFolder,
			filename: 'lazy-images.min.js',
		},
	},
	{
		mode: 'production',
		context: packagesFolder,
		entry: './intersectionobserver-polyfill.js',
		output: {
			path: packagesFolder,
			filename: 'intersectionobserver-polyfill.min.js',
		},
	},
];
