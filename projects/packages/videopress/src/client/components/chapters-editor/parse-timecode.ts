/**
 * Parse a user-typed timecode into integer milliseconds.
 *
 * Accepts the display format produced by `formatTimecode` (`H:MM:SS.t`) plus
 * looser forms a user would plausibly type: `MM:SS`, bare seconds (`90`,
 * `12.5`), unpadded parts, and surrounding whitespace. When more than one
 * `:`-separated part is present, minutes and seconds must be below 60 so
 * typos like `1:75` are rejected rather than silently reinterpreted.
 *
 * @param value - The raw input string.
 * @return The time in integer ms, or null when the input isn't a timecode.
 */
export function parseTimecode( value: string ): number | null {
	const parts = value.trim().split( ':' );
	if ( parts.length > 3 ) {
		return null;
	}

	const secondsPart = parts[ parts.length - 1 ];
	if ( ! /^\d+(\.\d+)?$/.test( secondsPart ) ) {
		return null;
	}
	if ( parts.slice( 0, -1 ).some( part => ! /^\d+$/.test( part ) ) ) {
		return null;
	}

	const seconds = parseFloat( secondsPart );
	const minutes = parts.length > 1 ? parseInt( parts[ parts.length - 2 ], 10 ) : 0;
	const hours = parts.length > 2 ? parseInt( parts[ 0 ], 10 ) : 0;
	if ( parts.length > 1 && seconds >= 60 ) {
		return null;
	}
	if ( parts.length > 2 && minutes >= 60 ) {
		return null;
	}

	return Math.round( ( ( hours * 60 + minutes ) * 60 + seconds ) * 1000 );
}
