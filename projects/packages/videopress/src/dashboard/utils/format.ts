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
