/**
 * Webpack plugin to make export mangling safe to use with I18nCheckWebapckPlugin.
 *
 * Based on Webpack's MangleExportsPlugin. This is the same except for the
 * addition of some default values in the `usedNames` set and the options
 * accepted by the constructor.
 */

const {
	UsageState,
	Template: {
		numberToIdentifier,
		NUMBER_OF_IDENTIFIER_START_CHARS,
		NUMBER_OF_IDENTIFIER_CONTINUATION_CHARS,
	},
	util: {
		comparators: { compareSelect, compareStringsNumeric },
	},
} = require( 'webpack' );
const { assignDeterministicIds } = require( 'webpack/lib/ids/IdHelpers' );

/** @typedef {import("../Compiler")} Compiler */
/** @typedef {import("../ExportsInfo")} ExportsInfo */
/** @typedef {import("../ExportsInfo").ExportInfo} ExportInfo */

/**
 * Determine if we can mangle.
 * @param {ExportsInfo} exportsInfo - exports info
 * @return {boolean} mangle is possible
 */
const canMangle = exportsInfo => {
	if ( exportsInfo.otherExportsInfo.getUsed( undefined ) !== UsageState.Unused ) {
		return false;
	}
	let hasSomethingToMangle = false;
	for ( const exportInfo of exportsInfo.exports ) {
		if ( exportInfo.canMangle === true ) {
			hasSomethingToMangle = true;
		}
	}
	return hasSomethingToMangle;
};

// Sort by name
const comparator = compareSelect( e => e.name, compareStringsNumeric );
/**
 * Mangle exports.
 * @param {boolean}             deterministic - use deterministic names
 * @param {ExportsInfo}         exportsInfo   - exports info
 * @param {boolean | undefined} isNamespace   - is namespace object
 * @return {void}
 */
const mangleExportsInfo = ( deterministic, exportsInfo, isNamespace ) => {
	if ( ! canMangle( exportsInfo ) ) {
		return;
	}
	const usedNames = new Set( [ '__', '_x', '_n', '_nx' ] );
	/** @type {ExportInfo[]} */
	const mangleableExports = [];

	// Avoid to renamed exports that are not provided when
	// 1. it's not a namespace export: non-provided exports can be found in prototype chain
	// 2. there are other provided exports and deterministic mode is chosen:
	//    non-provided exports would break the determinism
	let avoidMangleNonProvided = ! isNamespace;
	if ( ! avoidMangleNonProvided && deterministic ) {
		for ( const exportInfo of exportsInfo.ownedExports ) {
			if ( exportInfo.provided !== false ) {
				avoidMangleNonProvided = true;
				break;
			}
		}
	}
	for ( const exportInfo of exportsInfo.ownedExports ) {
		const name = exportInfo.name;
		if ( ! exportInfo.hasUsedName() ) {
			if (
				// Can the export be mangled?
				exportInfo.canMangle !== true ||
				// Never rename 1 char exports
				( name.length === 1 && /^[a-zA-Z0-9_$]/.test( name ) ) ||
				// Don't rename 2 char exports in deterministic mode
				( deterministic &&
					name.length === 2 &&
					/^[a-zA-Z_$][a-zA-Z0-9_$]|^[1-9][0-9]/.test( name ) ) ||
				// Don't rename exports that are not provided
				( avoidMangleNonProvided && exportInfo.provided !== true )
			) {
				exportInfo.setUsedName( name );
				usedNames.add( name );
			} else {
				mangleableExports.push( exportInfo );
			}
		}
		if ( exportInfo.exportsInfoOwned ) {
			const used = exportInfo.getUsed( undefined );
			if ( used === UsageState.OnlyPropertiesUsed || used === UsageState.Unused ) {
				mangleExportsInfo( deterministic, exportInfo.exportsInfo, false );
			}
		}
	}
	if ( deterministic ) {
		assignDeterministicIds(
			mangleableExports,
			e => e.name,
			comparator,
			( e, id ) => {
				const name = numberToIdentifier( id );
				const size = usedNames.size;
				usedNames.add( name );
				if ( size === usedNames.size ) {
					return false;
				}
				e.setUsedName( name );
				return true;
			},
			[
				NUMBER_OF_IDENTIFIER_START_CHARS,
				NUMBER_OF_IDENTIFIER_START_CHARS * NUMBER_OF_IDENTIFIER_CONTINUATION_CHARS,
			],
			NUMBER_OF_IDENTIFIER_CONTINUATION_CHARS,
			usedNames.size
		);
	} else {
		const usedExports = [];
		const unusedExports = [];
		for ( const exportInfo of mangleableExports ) {
			if ( exportInfo.getUsed( undefined ) === UsageState.Unused ) {
				unusedExports.push( exportInfo );
			} else {
				usedExports.push( exportInfo );
			}
		}
		usedExports.sort( comparator );
		unusedExports.sort( comparator );
		let i = 0;
		for ( const list of [ usedExports, unusedExports ] ) {
			for ( const exportInfo of list ) {
				let name;
				do {
					name = numberToIdentifier( i++ );
				} while ( usedNames.has( name ) );
				exportInfo.setUsedName( name );
			}
		}
	}
};

class MangleExportsPlugin {
	constructor( options ) {
		this._deterministic = options?.deterministic ?? true;
	}
	/**
	 * Apply the plugin
	 * @param {Compiler} compiler - the compiler instance
	 * @return {void}
	 */
	apply( compiler ) {
		const { _deterministic: deterministic } = this;
		compiler.hooks.compilation.tap( 'MangleExportsPlugin', compilation => {
			const moduleGraph = compilation.moduleGraph;
			compilation.hooks.optimizeCodeGeneration.tap( 'MangleExportsPlugin', modules => {
				if ( compilation.moduleMemCaches ) {
					throw new Error(
						"optimization.mangleExports can't be used with cacheUnaffected as export mangling is a global effect"
					);
				}
				for ( const module of modules ) {
					const isNamespace = module.buildMeta && module.buildMeta.exportsType === 'namespace';
					const exportsInfo = moduleGraph.getExportsInfo( module );
					mangleExportsInfo( deterministic, exportsInfo, isNamespace );
				}
			} );
		} );
	}
}

module.exports = MangleExportsPlugin;
