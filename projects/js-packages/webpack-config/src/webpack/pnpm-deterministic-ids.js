/**
 * Webpack plugin to make module IDs more deterministic when used with pnpm.
 *
 * Based on Webpack's DeterministicModuleIdsPlugin. This is the same except for the
 * addition of `fixPnpmPaths`.
 */

const { compareModulesByPreOrderIndexOrIdentifier } = require( 'webpack/lib/util/comparators' );
const {
	getUsedModuleIds,
	getFullModuleName,
	assignDeterministicIds,
} = require( 'webpack/lib/ids/IdHelpers' );

const PNPM_PATH_REGEXP = /(?<=^|[|!])(?:\.\.\/)*node_modules\/\.pnpm\/[^/]*\/node_modules\/([^|!]+)/g;

/**
 * Replace pnpm store paths in an identifier.
 *
 * Pnpm's store paths contain the version number of the package, which means
 * the identifier would change every time the package is updated. This strips
 * those out of the identifier.
 *
 * This does mean that a bundle with multiple versions of a package might wind
 * up with colliding identifiers, but Webpack already handles that.
 *
 * @param {string} identifier - Identifier.
 * @returns {string} Transformed identifier.
 */
function fixPnpmPaths( identifier ) {
	return identifier.replace( PNPM_PATH_REGEXP, '.pnpm/$1' );
}

/** @typedef {import("webpack/lib/Compiler")} Compiler */

class PnpmDeterministicModuleIdsPlugin {
	constructor( options ) {
		this.options = options || {};
	}

	/**
	 * Apply the plugin
	 *
	 * @param {Compiler} compiler - the compiler instance
	 * @returns {void}
	 */
	apply( compiler ) {
		compiler.hooks.compilation.tap( 'PnpmDeterministicModuleIdsPlugin', compilation => {
			compilation.hooks.moduleIds.tap( 'PnpmDeterministicModuleIdsPlugin', modules => {
				const chunkGraph = compilation.chunkGraph;
				const context = this.options.context ? this.options.context : compiler.context;
				const maxLength = this.options.maxLength || 3;

				const usedIds = getUsedModuleIds( compilation );
				assignDeterministicIds(
					Array.from( modules ).filter( module => {
						if ( ! module.needId ) {
							return false;
						}
						if ( chunkGraph.getNumberOfModuleChunks( module ) === 0 ) {
							return false;
						}
						return chunkGraph.getModuleId( module ) === null;
					} ),
					module => fixPnpmPaths( getFullModuleName( module, context, compiler.root ) ),
					compareModulesByPreOrderIndexOrIdentifier( compilation.moduleGraph ),
					( module, id ) => {
						const size = usedIds.size;
						usedIds.add( `${ id }` );
						if ( size === usedIds.size ) {
							return false;
						}
						chunkGraph.setModuleId( module, id );
						return true;
					},
					[ Math.pow( 10, maxLength ) ],
					10,
					usedIds.size
				);
			} );
		} );
	}
}

module.exports = PnpmDeterministicModuleIdsPlugin;
