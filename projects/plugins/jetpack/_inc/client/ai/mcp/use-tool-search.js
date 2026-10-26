/**
 * Search state shared by the MCP Read and Write views.
 */

import { useCallback, useState } from '@wordpress/element';

/**
 * Whether a tool matches every word of the query, in its title or description.
 *
 * @param {object} tool  - Tool descriptor from the API.
 * @param {string} query - Search text.
 * @return {boolean} True when the tool matches.
 */
export function matchesQuery( tool, query ) {
	const haystack = `${ tool.title ?? '' } ${ tool.description ?? '' }`.toLowerCase();
	return query
		.toLowerCase()
		.split( /\s+/ )
		.filter( Boolean )
		.every( word => haystack.includes( word ) );
}

/**
 * Search over a view's tools.
 *
 * @return {{query: string, setQuery: Function, isSearching: boolean, isVisible: Function}} Search state.
 */
export default function useToolSearch() {
	const [ query, setQuery ] = useState( '' );
	const isVisible = useCallback(
		( [ , tool ] ) => ! query || matchesQuery( tool, query ),
		[ query ]
	);
	return { query, setQuery, isSearching: query !== '', isVisible };
}
