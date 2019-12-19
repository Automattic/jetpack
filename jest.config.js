/**
 * External dependencies
 */
const path = require( 'path' );

module.exports = {
	preset: '@automattic/calypso-build',
	roots: [ '<rootDir>/extensions/' ],
	transform: {
		'\\.[jt]sx?$': path.join( __dirname, 'tests', 'jest-extensions-babel-transform' ),
		'\\.(gif|jpg|jpeg|png|svg|scss|sass|css)$': require.resolve(
			'@automattic/calypso-build/jest/transform/asset'
		),
	},
};
