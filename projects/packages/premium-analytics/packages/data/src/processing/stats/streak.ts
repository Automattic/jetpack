import { tz } from '@date-fns/tz';
import { addHours, format, fromUnixTime } from 'date-fns';
import { safeParseFloat } from '../../utils/parsing';
import { coerceStatsRecord } from './utils';
import type { StatsQueryParams } from '../../utils/stats-params';

export type StatsStreakResponse = Record< string, number >;

export type StatsStreakRawResponse = {
	streak?: Record< string, unknown >;
	data?: Record< string, number >;
};

export function sanitizeStatsStreakResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsStreakResponse {
	const data = coerceStatsRecord( coerceStatsRecord( response ).data );
	const gmtOffset = safeParseFloat( query?.gmtOffset );
	const streak: StatsStreakResponse = {};

	for ( const [ timestamp, count ] of Object.entries( data ) ) {
		const seconds = Number( timestamp );

		if ( ! Number.isFinite( seconds ) ) {
			continue;
		}

		const date = format( addHours( fromUnixTime( seconds ), gmtOffset ), 'yyyy-MM-dd', {
			in: tz( 'UTC' ),
		} );
		streak[ date ] = ( streak[ date ] ?? 0 ) + safeParseFloat( count );
	}

	return streak;
}
