const path = require( 'path' );
const glob = require( 'glob' );
const defaultConfig = require( './default.config' );

const getJestCustomConfig = () => {
	// support .js|.cjs|.mjs
	const files = glob.sync( 'jest.config.*' );
	return files.length ? require( path.join( process.cwd(), files[ 0 ] ) ) : {};
};

module.exports = {
	...defaultConfig,
	...getJestCustomConfig(),
};
