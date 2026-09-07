/**
 * External dependencies
 */
import { toBucketStamp } from '@jetpack-premium-analytics/datetime';

/** Parses a numeric string from the API, falling back to 0 when it is not a number. */
export function sanitizeStringNumber( value: string ): number {
	const parsed = parseFloat( value );
	return isNaN( parsed ) ? 0 : parsed;
}

type BucketBounds = { date_start: string; date_end: string };

/**
 * Re-stamp a store report row's bucket bounds into the one shape reports carry.
 *
 * @param row  - The row as the API returned it.
 * @param zone - The report's reporting timezone.
 * @return The row, with its bounds as timezone-naive wall times.
 */
export function withBucketStamps< T extends BucketBounds >( row: T, zone: string ): T {
	return {
		...row,
		date_start: toBucketStamp( row.date_start, zone ),
		date_end: toBucketStamp( row.date_end, zone ),
	};
}
