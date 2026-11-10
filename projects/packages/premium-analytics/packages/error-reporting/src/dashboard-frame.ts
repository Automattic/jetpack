export interface DashboardFrame {
	url: string;
	path: string;
	widget?: string;
	line?: number;
	column?: number;
}

const POSITION = /:(\d+):(\d+)$/;
const FRAME_LINE = /^\s*at\s|^[^:]*@/;
const WIDGET_PATH = /^widgets\/([^/]+)\//;
const QUERY_OR_HASH = /[?#]/;
const URL_START = /[\s(@]/;

/**
 * Where an allowlisted origin starts a frame URL in one stack line.
 *
 * An origin can also appear inside another script's URL, as the value of a query parameter. The
 * frame is that other script's, so the origin counts only where a URL itself begins.
 *
 * @param line   - The stack line.
 * @param origin - The allowlisted origin to look for.
 * @return The index of the frame URL, or -1.
 */
function originStart( line: string, origin: string ): number {
	for ( let at = line.indexOf( origin ); at !== -1; at = line.indexOf( origin, at + 1 ) ) {
		if ( at === 0 || URL_START.test( line[ at - 1 ] ) ) {
			return at;
		}
	}

	return -1;
}

/**
 * Reads the script URL, path, widget and position out of one stack line.
 *
 * @param line   - The stack line containing the origin.
 * @param origin - The allowlisted origin found in the line.
 * @param start  - Where that origin starts the frame URL.
 * @return The parsed frame.
 */
function parseFrame( line: string, origin: string, start: number ): DashboardFrame {
	const url = line.slice( start ).split( /[\s)]/ )[ 0 ];
	const position = POSITION.exec( url );
	const withoutPosition = position ? url.slice( 0, position.index ) : url;
	const relative = withoutPosition.slice( origin.length );
	const cut = relative.search( QUERY_OR_HASH );
	const path = cut === -1 ? relative : relative.slice( 0, cut );

	return {
		url,
		path,
		widget: WIDGET_PATH.exec( path )?.[ 1 ],
		line: position ? Number( position[ 1 ] ) : undefined,
		column: position ? Number( position[ 2 ] ) : undefined,
	};
}

/**
 * Finds the first stack frame served from an allowlisted script origin.
 *
 * @param stack   - The error stack, if any.
 * @param origins - Absolute URL prefixes that count as dashboard code, if any.
 * @return The frame, or null when none matches.
 */
export function findDashboardFrame(
	stack: string | undefined,
	origins: string[] | undefined
): DashboardFrame | null {
	if ( typeof stack !== 'string' || ! Array.isArray( origins ) ) {
		return null;
	}

	const candidates = origins.filter( origin => typeof origin === 'string' && origin !== '' );

	for ( const line of stack.split( '\n' ) ) {
		if ( ! FRAME_LINE.test( line ) ) {
			continue;
		}
		for ( const origin of candidates ) {
			const start = originStart( line, origin );
			if ( start !== -1 ) {
				return parseFrame( line, origin, start );
			}
		}
	}

	return null;
}
