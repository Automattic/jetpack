/**
 * Build the `[videopress …]` shortcode string. Returns empty if the GUID
 * is missing (non-VideoPress items). Matches the legacy admin format:
 * `[videopress GUID w=W h=H]` with `w=`/`h=` only included when present
 * and values rendered bare (no quotes).
 *
 * @param guid   - VideoPress GUID, or undefined for non-VideoPress items.
 * @param width  - Video width in pixels, if known.
 * @param height - Video height in pixels, if known.
 * @return The shortcode string, or '' when no GUID is available.
 */
export function buildShortcode(
	guid: string | undefined,
	width: number | undefined,
	height: number | undefined
): string {
	if ( ! guid ) {
		return '';
	}
	const w = width ? ` w=${ width }` : '';
	const h = height ? ` h=${ height }` : '';
	return `[videopress ${ guid }${ w }${ h }]`;
}

/**
 * Format a duration in seconds as `mm:ss` or `hh:mm:ss`.
 *
 * @param seconds - Total seconds.
 * @return Formatted duration.
 */
export function formatDuration( seconds: number ): string {
	const safe = Math.max( 0, Math.floor( seconds ) );
	const h = Math.floor( safe / 3600 );
	const m = Math.floor( ( safe % 3600 ) / 60 );
	const s = safe % 60;
	const pad = ( n: number ) => String( n ).padStart( 2, '0' );
	return h > 0 ? `${ h }:${ pad( m ) }:${ pad( s ) }` : `${ pad( m ) }:${ pad( s ) }`;
}

/**
 * Format a watch-time value in the largest unit that yields a value
 * ≥ 1, picking from hours / minutes / seconds. Hours show one decimal
 * place ("1.1 h") to match the Figma; smaller units are integers.
 *
 * @param seconds - Total seconds.
 * @return Compact human-readable duration.
 */
export function formatWatchTime( seconds: number ): string {
	if ( seconds >= 3_600 ) {
		const hours = seconds / 3_600;
		return `${ hours.toFixed( 1 ) } h`;
	}
	if ( seconds >= 60 ) {
		return `${ Math.round( seconds / 60 ) } min`;
	}
	return `${ Math.round( seconds ) } s`;
}

const BYTE_UNITS = [ 'B', 'KB', 'MB', 'GB', 'TB' ] as const;

/**
 * Format a byte count using binary units, one decimal place above KB.
 *
 * @param bytes - Total bytes.
 * @return Formatted size.
 */
export function formatBytes( bytes: number ): string {
	if ( bytes < 1024 ) {
		return `${ bytes } B`;
	}
	let value = bytes;
	let unitIndex = 0;
	while ( value >= 1024 && unitIndex < BYTE_UNITS.length - 1 ) {
		value /= 1024;
		unitIndex += 1;
	}
	return `${ value.toFixed( 1 ) } ${ BYTE_UNITS[ unitIndex ] }`;
}
