const babelJest = require(
	require.resolve( 'babel-jest', {
		paths: [ require.resolve( 'jetpack-js-tools/jest/config.base.js' ) ],
	} )
).default;

// Fields that pick which suites run, and where, but never change what a file transforms to.
const RUN_ONLY_FIELDS = [
	'id',
	'displayName',
	'testEnvironment',
	'testMatch',
	'testPathIgnorePatterns',
];

const withoutRunOnlyFields = options => {
	const config = JSON.parse( options.configString );
	RUN_ONLY_FIELDS.forEach( field => delete config[ field ] );
	return { ...options, configString: JSON.stringify( config ) };
};

/**
 * babel-jest, keyed so the timezone passes reuse what the main run already transformed.
 *
 * Jest hashes the whole project config into every cache key, so without this a config that only
 * lists other suites re-transforms the entire module graph.
 */
module.exports = {
	createTransformer( options ) {
		const transformer = babelJest.createTransformer( options );

		return {
			...transformer,
			getCacheKey: ( source, filename, transformOptions ) =>
				transformer.getCacheKey( source, filename, withoutRunOnlyFields( transformOptions ) ),
			getCacheKeyAsync: ( source, filename, transformOptions ) =>
				transformer.getCacheKeyAsync( source, filename, withoutRunOnlyFields( transformOptions ) ),
		};
	},
};
