import { tz } from '@date-fns/tz';
import { siteTimeZone } from '@jetpack-premium-analytics/datetime';
import { format, fromUnixTime } from 'date-fns';
import { safeParseFloat } from '../../utils/parsing';
import { coerceStatsRecord } from './utils';

export type StatsStreakResponse = Record< string, number >;

export type StatsStreakRawResponse = {
	streak?: Record< string, unknown >;
	data?: Record< string, number >;
};

export function sanitizeStatsStreakResponse( response: unknown ): StatsStreakResponse {
	const data = coerceStatsRecord( coerceStatsRecord( response ).data );
	// Alone among the Stats payloads this one keys by instant, not by day, so the
	// calendar day has to be resolved here. A named zone rather than the site's
	// numeric offset, so posts either side of a DST change land on the right day.
	const zone = tz( siteTimeZone() );
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
