export interface DashboardFrame {
	url: string;
	path: string;
	widget?: string;
	line?: number;
	column?: number;
}

const POSITION = /:(\d+):(\d+)$/;
const WIDGET_PATH = /^widgets\/([^/]+)\//;

/**
 * Reads the script URL, path, widget and position out of one stack line.
 *
 * @param line   - The stack line containing the origin.
 * @param origin - The allowlisted origin found in the line.
 * @return The parsed frame.
 */
function parseFrame( line: string, origin: string ): DashboardFrame {
	const start = line.indexOf( origin );
	const url = line.slice( start ).split( /[\s)]/ )[ 0 ];
	const position = POSITION.exec( url );
	const withoutPosition = position ? url.slice( 0, position.index ) : url;
	const path = withoutPosition.slice( origin.length ).replace( /[?#].*$/, '' );

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
 * @param origins - Absolute URL prefixes that count as dashboard code.
 * @return The frame, or null when none matches.
 */
export function findDashboardFrame(
	stack: string | undefined,
	origins: string[]
): DashboardFrame | null {
	if ( typeof stack !== 'string' ) {
		return null;
	}

	const candidates = origins.filter( origin => typeof origin === 'string' && origin !== '' );

	for ( const line of stack.split( '\n' ) ) {
		const origin = candidates.find( candidate => line.includes( candidate ) );
		if ( origin ) {
			return parseFrame( line, origin );
		}
	}

	return null;
}
