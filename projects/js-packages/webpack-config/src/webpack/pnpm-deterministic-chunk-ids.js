/**
 * Webpack plugin to make chunk IDs more deterministic when used with pnpm.
 *
 * Based on Webpack's DeterministicChunkIdsPlugin. This is the same except for the
 * addition of `fixPnpmPaths`.
 */

const {
	assignDeterministicIds,
	getFullChunkName,
	getUsedChunkIds,
} = require( 'webpack/lib/ids/IdHelpers' );
const { fixPnpmPaths } = require( './pnpm-fix-paths.js' );

const PLUGIN_NAME = 'PnpmDeterministicChunkIdsPlugin';

class PnpmDeterministicChunkIdsPlugin {
	constructor( options = {} ) {
		this.options = options;
	}

	/**
	 * Applies the plugin by registering its hooks on the compiler.
	 * @param {import('webpack').Compiler} compiler - the compiler instance
	 * @return {void}
	 */
	apply( compiler ) {
		const { compareChunksNatural } = compiler.webpack.util.comparators;

		compiler.hooks.compilation.tap( PLUGIN_NAME, compilation => {
			compilation.hooks.chunkIds.tap( PLUGIN_NAME, chunks => {
				const chunkGraph = compilation.chunkGraph;
				const context = this.options.context ? this.options.context : compiler.context;
				const maxLength = this.options.maxLength || 3;

				const compareNatural = compareChunksNatural( chunkGraph );

				const usedIds = getUsedChunkIds( compilation );
				assignDeterministicIds(
					[ ...chunks ].filter( chunk => chunk.id === null ),
					chunk => fixPnpmPaths( getFullChunkName( chunk, chunkGraph, context, compiler.root ) ),
					compareNatural,
					( chunk, id ) => {
						const size = usedIds.size;
						usedIds.add( `${ id }` );
						if ( size === usedIds.size ) return false;
						chunk.id = id;
						chunk.ids = [ id ];
						return true;
					},
					[ 10 ** maxLength ],
					10,
					usedIds.size
				);
			} );
		} );
	}
}

module.exports = PnpmDeterministicChunkIdsPlugin;
