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
const { fixPnpmPaths } = require( './pnpm-fix-paths.js' );

/** @typedef {import("webpack/lib/Compiler")} Compiler */
/** @typedef {import("webpack/lib/Module")} Module */

const PLUGIN_NAME = 'PnpmDeterministicModuleIdsPlugin';

class PnpmDeterministicModuleIdsPlugin {
	constructor( options = {} ) {
		this.options = options;
	}

	/**
	 * Applies the plugin by registering its hooks on the compiler.
	 * @param {Compiler} compiler - the compiler instance
	 * @return {void}
	 */
	apply( compiler ) {
		compiler.hooks.compilation.tap( PLUGIN_NAME, compilation => {
			compilation.hooks.moduleIds.tap( PLUGIN_NAME, () => {
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
					[ 10 ** maxLength ],
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
