/** Shared statistics utilities. */

/** Calculate median. */
export function median( values ) {
	if ( values.length === 0 ) {
		return 0;
	}

	const sorted = [ ...values ].sort( ( a, b ) => a - b );
	const mid = Math.floor( sorted.length / 2 );

	if ( sorted.length % 2 !== 0 ) {
		return sorted[ mid ];
	}

	return ( sorted[ mid - 1 ] + sorted[ mid ] ) / 2;
}

/** Calculate mean. */
export function mean( values ) {
	if ( values.length === 0 ) {
		return 0;
	}

	return values.reduce( ( a, b ) => a + b, 0 ) / values.length;
}

/** Calculate standard deviation. */
export function stdDev( values ) {
	if ( values.length === 0 ) {
		return 0;
	}

	const avg = mean( values );
	const variance =
		values.reduce( ( sum, val ) => sum + Math.pow( val - avg, 2 ), 0 ) / values.length;

	return Math.sqrt( variance );
}

/** Truncate to decimal places. */
export function truncate( n, decimals = 2 ) {
	return Number( n.toFixed( decimals ) );
}
