import { tz } from '@date-fns/tz';
import { format, fromUnixTime } from 'date-fns';
import { safeParseFloat } from '../../utils/parsing';
import { coerceStatsRecord } from './utils';
import type { StatsSanitizerParams } from '../../utils/stats-params';

export type StatsStreakResponse = Record< string, number >;

export type StatsStreakRawResponse = {
	streak?: Record< string, unknown >;
	data?: Record< string, number >;
};

export function sanitizeStatsStreakResponse(
	response: unknown,
	query: StatsSanitizerParams
): StatsStreakResponse {
	const data = coerceStatsRecord( coerceStatsRecord( response ).data );
	// Keyed by instant, not by day, so the calendar day is resolved here. By zone
	// rather than by offset: a fixed offset is a day out either side of a DST change.
	const zone = tz( query.timezone );
	const streak: StatsStreakResponse = {};

	for ( const [ timestamp, count ] of Object.entries( data ) ) {
		const seconds = Number( timestamp );

		if ( ! Number.isFinite( seconds ) ) {
			continue;
		}

		const date = format( fromUnixTime( seconds ), 'yyyy-MM-dd', { in: zone } );
		streak[ date ] = ( streak[ date ] ?? 0 ) + safeParseFloat( count );
	}

	return streak;
}
