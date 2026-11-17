/**
 * Read a query value the way the router reads it off a full page load, so an in-app navigation
 * lands on the same search state: a value that parses as JSON is handed over parsed.
 *
 * @param value - The decoded query value.
 * @return The value as the route reads it.
 */
function parseSearchValue( value: string ): unknown {
	try {
		return JSON.parse( value );
	} catch {
		return value;
	}
}

/**
 * Split the route `match` hands back into the path and the search the router takes.
 *
 * @param path - The in-app route, its query included.
 * @return The router link target.
 */
export function toRouteTarget( path: string ): { to: string; search?: Record< string, unknown > } {
	const queryStart = path.indexOf( '?' );
	if ( queryStart === -1 ) {
		return { to: path };
	}

	return {
		to: path.slice( 0, queryStart ),
		search: Object.fromEntries(
			[ ...new URLSearchParams( path.slice( queryStart + 1 ) ) ].map( ( [ key, value ] ) => [
				key,
				parseSearchValue( value ),
			] )
		),
	};
}
