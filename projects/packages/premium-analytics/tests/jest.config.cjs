const path = require( 'path' );
const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	rootDir: path.join( __dirname, '..' ),
	moduleNameMapper: {
		...baseConfig.moduleNameMapper,
		// Resolve internal `packages/*` imports to their TypeScript source,
		// mirroring the tsconfig `paths` alias (see README → "Internal packages").
		'^@jetpack-premium-analytics/(.*)$': path.join( __dirname, '..', 'packages', '$1', 'src' ),
	},
};
