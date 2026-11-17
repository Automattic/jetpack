const path = require( 'path' );

/**
 * `moduleNameMapper` entries that give `@automattic/charts` a measured parent in jsdom.
 *
 * The real module is resolved here, from the project, because it is the charts package's
 * dependency: neither the stand-in nor a plugin that renders a chart can resolve it.
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
