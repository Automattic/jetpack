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
		// Plain CSS shipped by node_modules packages is not transformed by the
		// base config (its asset stub only covers first-party files), so stub
		// it out here.
		'^@automattic/(ui|charts)/style\\.css$': path.join( __dirname, 'style-stub.cjs' ),
	},
};
