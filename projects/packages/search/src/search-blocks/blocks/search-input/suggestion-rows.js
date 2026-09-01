// Canonical render order; matches the source order `fetchSuggestions` produces.
const TYPE_ORDER = [ 'query', 'taxonomy', 'post' ];

/**
 * Flatten grouped suggestions into a single `data-wp-each` row stream.
 * Headers and options share the list — discriminated by `isHeader`.
 * `optionIndex` only counts options so arrow keys don't skip over headers.
 *
 * @param {Array<{type:string,text:string,url?:string,taxonomy?:string,slug?:string}>} suggestions    - Flat list from fetchSuggestions.
 * @param {string}                                                                     listboxId      - Parent `<ul>` id.
 * @param {{query:string,taxonomy:string,post:string}}                                 labels         - Translated group titles.
 * @param {Array<string>}                                                              [enabledTypes] - Subset of `TYPE_ORDER`.
 * @return {Array<object>} Rows ready for `data-wp-each`.
 */
export function buildSuggestionRows( suggestions, listboxId, labels, enabledTypes ) {
	if ( ! Array.isArray( suggestions ) || suggestions.length === 0 ) {
		return [];
	}

	const safeLabels = labels ?? {};
	// Author-selected subset, in canonical order. Non-array = all.
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
 * Selectable row count (excludes headers) for arrow-key clamping.
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
 * Bridge `optionIndex` (arrow-key cursor) to the underlying row.
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
