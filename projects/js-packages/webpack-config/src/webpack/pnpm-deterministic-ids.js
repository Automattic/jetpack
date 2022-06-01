/**
 * Webpack plugin to make module IDs more deterministic when used with pnpm.
 *
 * Based on Webpack's DeterministicModuleIdsPlugin. This is the same except for the
 * addition of `fixPnpmPaths`.
 */

const {
	getUsedModuleIdsAndModules,
	getFullModuleName,
	assignDeterministicIds,
} = require( 'webpack/lib/ids/IdHelpers' );
const { compareModulesByPreOrderIndexOrIdentifier } = require( 'webpack/lib/util/comparators' );

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

/** @typedef {import("../Compiler")} Compiler */
/** @typedef {import("../Module")} Module */

class PnpmDeterministicModuleIdsPlugin {
	constructor( options = {} ) {
		this.options = options;
	}

	/**
	 * Apply the plugin
	 *
	 * @param {Compiler} compiler - the compiler instance
	 * @returns {void}
	 */
	apply( compiler ) {
		compiler.hooks.compilation.tap( 'PnpmDeterministicModuleIdsPlugin', compilation => {
			compilation.hooks.moduleIds.tap( 'PnpmDeterministicModuleIdsPlugin', () => {
				const chunkGraph = compilation.chunkGraph;
				const context = this.options.context ? this.options.context : compiler.context;
				const maxLength = this.options.maxLength || 3;
				const failOnConflict = this.options.failOnConflict || false;
				const fixedLength = this.options.fixedLength || false;
				const salt = this.options.salt || 0;
				let conflicts = 0;

				const [ usedIds, modules ] = getUsedModuleIdsAndModules( compilation, this.options.test );
				assignDeterministicIds(
					modules,
					module => fixPnpmPaths( getFullModuleName( module, context, compiler.root ) ),
					failOnConflict
						? () => 0
						: compareModulesByPreOrderIndexOrIdentifier( compilation.moduleGraph ),
					( module, id ) => {
						const size = usedIds.size;
						usedIds.add( `${ id }` );
						if ( size === usedIds.size ) {
							conflicts++;
							return false;
						}
						chunkGraph.setModuleId( module, id );
						return true;
					},
					[ Math.pow( 10, maxLength ) ],
					fixedLength ? 0 : 10,
					usedIds.size,
					salt
				);
				if ( failOnConflict && conflicts ) {
					throw new Error(
						`Assigning deterministic module ids has lead to ${ conflicts } conflict${
							conflicts > 1 ? 's' : ''
						}.\nIncrease the 'maxLength' to increase the id space and make conflicts less likely (recommended when there are many conflicts or application is expected to grow), or add an 'salt' number to try another hash starting value in the same id space (recommended when there is only a single conflict).`
					);
				}
			} );
		} );
	}
}

module.exports = PnpmDeterministicModuleIdsPlugin;
