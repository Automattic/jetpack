/**
 * Jest resolver that loads some packages through their ESM builds.
 *
 * The rolldown CommonJS builds of these packages snapshot circular imports
 * before the exporting module has run, so `BaseControl` and the block list
 * arrive as `undefined` in jest. Babel's ESM interop reads bindings at use
 * time instead, which is what every ESM consumer already relies on.
 */
const ESM_PACKAGES = new Set( [ '@wordpress/components', '@wordpress/block-editor' ] );

/**
 *
 * @param request
 * @param options
 */
/**
 * Resolve a module, through its ESM entry for the packages listed above.
 *
 * @param {string} request - Module request.
 * @param {object} options - Jest resolver options, including `defaultResolver` and `conditions`.
 * @return {string} Resolved path.
 */
function resolver( request, options ) {
	if ( ! ESM_PACKAGES.has( request ) ) {
		return options.defaultResolver( request, options );
	}
	return options.defaultResolver( request, {
		...options,
		conditions: [ ...( options.conditions ?? [] ), 'import' ],
	} );
}

module.exports = resolver;
module.exports.ESM_PACKAGES = ESM_PACKAGES;
