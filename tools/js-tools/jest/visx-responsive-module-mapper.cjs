const path = require( 'path' );

/**
 * `moduleNameMapper` entries that give `@automattic/charts` a measured parent in jsdom.
 *
 * The second entry is how the stand-in reaches the real module. It is resolved here rather
 * than in the stand-in because `@visx/responsive` is the charts package's dependency, not a
 * direct one of a plugin that renders a chart, so it resolves from neither that plugin nor
 * `jetpack-js-tools`.
 *
 * @param {string} projectRoot - The project's jest `rootDir`.
 * @return {object} Entries to spread into `moduleNameMapper`.
 */
module.exports = function visxResponsiveModuleMapper( projectRoot ) {
	const actual = require.resolve( '@visx/responsive', {
		paths: [ path.join( projectRoot, 'node_modules', '@automattic', 'charts' ), projectRoot ],
	} );

	return {
		'^@visx/responsive$': require.resolve( './visx-responsive-stub.cjs' ),
		'^jetpack-js-tools/jest/visx-responsive-actual$': actual,
	};
};
