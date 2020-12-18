const path = require( 'path' );
const packagesFolder = path.resolve( path.dirname( path.dirname( path.dirname( __dirname ) ) ), 'packages/lazy-images/src/js' );

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
