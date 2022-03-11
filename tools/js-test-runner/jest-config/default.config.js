/**
 * External dependencies
 */
const path = require( 'path' );
const glob = require( 'glob' );

const getBabelConfig = () => {
	// support babel.config.* | .babelrc | .bablerc.*
	const files = glob.sync( 'babel.config.*', { dot: true } );
	return files.length
		? path.join( process.cwd(), files[ 0 ] )
		: path.join( __dirname, './babel.config.js' );
};

const defaultConfig = {
	preset: '@wordpress/jest-preset-default',
	rootDir: process.cwd(),
	testEnvironment: 'jsdom',
	// TODO: remove as soon gutenberg release new version
	//https://github.com/WordPress/gutenberg/blob/%40wordpress/jest-preset-default%407.1.5-next.33ec3857e2.0/packages/jest-preset-default/jest-preset.js
	testMatch: [ '**/__tests__/**/*.[jt]s?(x)', '**/test/*.[jt]s?(x)', '**/?(*.)test.[jt]s?(x)' ],
	moduleNameMapper: {
		'\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': path.join(
			__dirname,
			'./fileMock.js'
		),
		'\\.module\\.s?css$': 'identity-obj-proxy',
		jetpackConfig: path.join( __dirname, './jetpack.config' ),
	},
	coverageReporters: [ 'clover', 'lcov' ],
	collectCoverageFrom: [
		'**/*.{js,jsx}',
		'!**/node_modules/**',
		'!**/vendor/**',
		'!**/jetpack_vendor/**',
		'!**/wordpress/**', // WorDBless.
		'!**/__tests__/**',
		'!**/coverage/**',
		'!test-main.{js,jsx}',
		'!jest.setup.{js,jsx}',
	],
	transform: {
		'\\.[jt]sx?$': [ require.resolve( 'babel-jest' ), { configFile: getBabelConfig() } ],
	},
};

module.exports = defaultConfig;
