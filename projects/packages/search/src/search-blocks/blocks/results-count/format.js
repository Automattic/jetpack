/**
 * Pure template formatter for the results-count block. Kept in its own
 * module so it can be unit-tested without pulling in
 * `@wordpress/interactivity` (which needs a DOM) through the store, and so
 * the same function powers the editor preview (edit.js) and the runtime
 * getter (store/index.js) without duplicating the substitution logic.
 *
 * Recognized placeholders: `%1$d` first shown, `%2$d` last shown,
 * `%3$d` total, `%4$s` query.
 *
 * Any other printf-style placeholder (e.g. `%5$d`, `%1$s`, `%10$d`) is
 * left untouched rather than silently stripped — authors get a visible
 * hint when they mistype or reach for an unsupported index.
 *
 * @param {string} template   - Raw template string.
 * @param {object} vars       - Interpolation variables.
 * @param {number} vars.first - 1-based index of the first shown result.
 * @param {number} vars.last  - 1-based index of the last shown result.
 * @param {number} vars.total - Total result count from the search response.
 * @param {string} vars.query - Current search query.
 * @return {string} Template with supported placeholders substituted.
 */
export function formatResultsCountText( template, { first, last, total, query } ) {
	const map = {
		'%1$d': String( first ),
		'%2$d': String( last ),
		'%3$d': String( total ),
		'%4$s': String( query ),
	};
	// Match any `%<digits>$<letter>` sequence so both known and unknown
	// placeholders flow through `replace()`; the callback restores unknown
	// matches verbatim via the default branch. There is no escape sequence
	// for emitting a literal `%1$d`-style token — templates here are short
	// human copy, not arbitrary text that might collide with placeholders.
	return String( template ?? '' ).replace( /%\d+\$[a-zA-Z]/g, match =>
		Object.prototype.hasOwnProperty.call( map, match ) ? map[ match ] : match
	);
}
