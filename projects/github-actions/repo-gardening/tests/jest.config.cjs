const path = require( 'path' );
const nodeConfig = require( 'jetpack-js-tools/jest/config.node.js' );

module.exports = {
	...nodeConfig,
	rootDir: path.resolve( __dirname, '..' ),
	roots: [ '<rootDir>/src/', '<rootDir>/tests/' ],
};
