/**
 * Ordered list of suggestion types — drives both the group ordering in the
 * rendered dropdown and the source order of the API response after the
 * shared `fetchSuggestions` has flattened it.
 */
const TYPE_ORDER = [ 'query', 'taxonomy', 'post' ];

/**
 * Flatten grouped suggestions into a single row stream for `data-wp-each`.
 *
 * The Interactivity API's list-rendering directive only iterates over a
 * single array, so the group headers and the option rows need to live in
 * the same list — discriminated by `isHeader`. Two `<li>` siblings inside
 * the same `<template>`, each gated by `data-wp-bind--hidden` against the
 * row's `isHeader` flag, render the correct one. The pattern mirrors how
 * `active-filters/render.php` walks a flat `state.activePills` list.
 *
 * Each option row also receives `optionIndex` (its 0-based position among
 * option rows only — headers do not consume an index, so ArrowDown / ArrowUp
 * move through the dropdown linearly without skipping over labels), `optionId`
 * (`${ listboxId }-option-${ optionIndex }` — used as the `<li id>` for
 * `aria-activedescendant`), and `key` (a stable, collision-proof key for
 * `data-wp-each-key`: `hdr:<type>` for headers, `opt:<type>:<originalIndex>`
 * for options).
 *
 * The `labels` argument carries the translated group titles. They come from
 * PHP via `state.strings` because `@wordpress/i18n` isn't yet available as
 * a Script Module (the blocks build target), so client-side translation
 * isn't an option in this view bundle.
 *
 * The `enabledTypes` argument is the per-block author selection of which
 * suggestion sections to render. The canonical render order is preserved
 * regardless of the order `enabledTypes` was saved in; unknown strings are
 * dropped silently. Passing `undefined` (or any non-array) means "all
 * three" so older callers stay backward-compatible.
 *
 * @param {Array<{type: 'query'|'post'|'taxonomy', text: string, url?: string, taxonomy?: string, slug?: string}>} suggestions
 *                                                                                                                                Flat list returned by `fetchSuggestions`.
 * @param {string}                                                                                                 listboxId      - DOM id of the parent `<ul role="listbox">`. Used to
 *                                                                                                                                bake `optionId` so the input's `aria-activedescendant` can target it.
 * @param {{query: string, taxonomy: string, post: string}}                                                        labels
 *                                                                                                                                Translated group titles. Missing keys render as the bare type string.
 * @param {Array<string>}                                                                                          [enabledTypes]
 *                                                                                                                                Subset of TYPE_ORDER the block author enabled. Omit / pass non-array for "all".
 * @return {Array<object>} Rows ready for `data-wp-each`.
 */
export function buildSuggestionRows( suggestions, listboxId, labels, enabledTypes ) {
	if ( ! Array.isArray( suggestions ) || suggestions.length === 0 ) {
		return [];
	}

	const safeLabels = labels ?? {};
	// Filter TYPE_ORDER to the author's selection while preserving the
	// canonical render order. `null` / `undefined` / non-array short-circuits
	// to "all enabled" so older callers (and tests) keep working.
	const types = Array.isArray( enabledTypes )
		? TYPE_ORDER.filter( t => enabledTypes.includes( t ) )
		: TYPE_ORDER;
	if ( types.length === 0 ) {
		return [];
	}

	const rows = [];
	let optionIndex = 0;

	for ( const type of types ) {
		const indexed = suggestions
			.map( ( item, originalIndex ) => ( { item, originalIndex } ) )
			.filter( ( { item } ) => item.type === type );

		if ( indexed.length === 0 ) {
			continue;
		}

		rows.push( {
			key: `hdr:${ type }`,
			isHeader: true,
			type,
			label: safeLabels[ type ] ?? type,
		} );

		for ( const { item, originalIndex } of indexed ) {
			rows.push( {
				key: `opt:${ type }:${ originalIndex }`,
				isHeader: false,
				type,
				text: item.text,
				url: item.url ?? '',
				taxonomy: item.taxonomy ?? '',
				slug: item.slug ?? '',
				optionIndex,
				optionId: `${ listboxId }-option-${ optionIndex }`,
			} );
			optionIndex += 1;
		}
	}

	return rows;
}

/**
 * Count of selectable rows (excludes headers). Hoisted into its own helper
 * because the view bundle needs it for arrow-key clamping and it would be
 * fragile to filter rows again inside the keydown handler.
 *
 * @param {Array<object>} rows - Output of `buildSuggestionRows`.
 * @return {number} Number of option rows.
 */
export function countOptions( rows ) {
	let n = 0;
	for ( const row of rows ) {
		if ( ! row.isHeader ) {
			n += 1;
		}
	}
	return n;
}

/**
 * Find a row's index in the flat list by its `optionIndex`. Arrow-key
 * navigation tracks the option index (so headers don't consume key strokes),
 * but selection lookups need the underlying row — this bridges the two.
 *
 * @param {Array<object>} rows        - Output of `buildSuggestionRows`.
 * @param {number}        optionIndex - Target option index.
 * @return {object|null} Matching row, or null when out of range.
 */
export function rowAtOptionIndex( rows, optionIndex ) {
	if ( optionIndex < 0 ) {
		return null;
	}
	for ( const row of rows ) {
		if ( ! row.isHeader && row.optionIndex === optionIndex ) {
			return row;
		}
	}
	return null;
}
