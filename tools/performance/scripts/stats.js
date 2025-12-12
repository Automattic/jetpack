/**
 * Shared statistics utilities for performance testing
 *
 * These functions are used by both measure-lcp.js and calibrate-throttling.js
 * to calculate summary statistics from measurement data.
 */

/**
 * Calculate the median of an array of numbers
 *
 * @param {number[]} values - Array of numeric values
 * @return {number} The median value
 */
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

/**
 * Calculate the mean (average) of an array of numbers
 *
 * @param {number[]} values - Array of numeric values
 * @return {number} The mean value
 */
export function mean( values ) {
	if ( values.length === 0 ) {
		return 0;
	}

	return values.reduce( ( a, b ) => a + b, 0 ) / values.length;
}

/**
 * Calculate the standard deviation of an array of numbers
 *
 * @param {number[]} values - Array of numeric values
 * @return {number} The standard deviation
 */
export function stdDev( values ) {
	if ( values.length === 0 ) {
		return 0;
	}

	const avg = mean( values );
	const variance =
		values.reduce( ( sum, val ) => sum + Math.pow( val - avg, 2 ), 0 ) / values.length;

	return Math.sqrt( variance );
}

/**
 * Truncate a number to a specified number of decimal places
 *
 * @param {number} n        - The number to truncate
 * @param {number} decimals - Number of decimal places (default: 2)
 * @return {number} The truncated number
 */
export function truncate( n, decimals = 2 ) {
	return Number( n.toFixed( decimals ) );
}
