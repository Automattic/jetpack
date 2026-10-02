/**
 * External dependencies
 */
import { getDatePart } from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */
import { StatsResponseShapeError } from '../../utils/api-error';
import { safeParseFloat, safeParseInt } from '../../utils/parsing';
import { coerceStatsArray, coerceStatsRecord } from './utils';
import type { StatsQueryParams } from '../../utils/stats-params';

export type StatsHourOfDayBucket = {
	hour: number;
	views: number;
};

export type StatsHourOfDayReport = {
	startDate?: string;
	date?: string;
	/** Calendar days the buckets sum over, inclusive of both ends. */
	days: number;
	buckets: StatsHourOfDayBucket[];
};

const HOURS_IN_DAY = 24;
const HOUR_OF_DAY_DIMENSION = 'hour-of-day';

// Validate before Number() because empty and null values coerce to midnight.
const HOUR_LABEL = /^\d{1,2}$/;

/**
 * Normalize an hour-of-day response into 24 fixed-position buckets.
 *
 * @param  response - Raw proxy response.
 * @param  query    - Request params used when the response omits its range.
 * @return The 24-bucket report.
 * @throws {StatsResponseShapeError} When the response is not an `hour-of-day` payload.
 */
export function sanitizeStatsHourOfDayResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsHourOfDayReport {
	const payload = coerceStatsRecord( response );

	// Another dimension folds the same fields into different buckets, so a mismatched
	// response is still a well-formed one that must not be drawn as hours.
	if ( payload.dimension !== HOUR_OF_DAY_DIMENSION ) {
		throw new StatsResponseShapeError(
			`Expected a ${ HOUR_OF_DAY_DIMENSION } response, received dimension "${ String(
				payload.dimension
			) }"`
		);
	}

	const fields = coerceStatsArray< string >( payload.fields );
	const periodAt = fields.indexOf( 'period' );
	const viewsAt = fields.indexOf( 'views' );
	const views = new Array< number >( HOURS_IN_DAY ).fill( 0 );

	if ( periodAt === -1 || viewsAt === -1 ) {
		throw new StatsResponseShapeError(
			`Expected fields [period, views], received ${ JSON.stringify( fields ) }`
		);
	}

	if ( ! Array.isArray( payload.data ) ) {
		throw new StatsResponseShapeError( 'Expected hour-of-day data to be an array' );
	}

	// The endpoint reports the range it actually read, so take its count rather
	// than re-deriving one from the echoed dates.
	const days = safeParseInt( payload.days );

	if ( days < 1 ) {
		throw new StatsResponseShapeError(
			`Expected a positive day count, received ${ JSON.stringify( payload.days ) }`
		);
	}

	payload.data.forEach( row => {
		if ( ! Array.isArray( row ) ) {
			return;
		}

		const label = row[ periodAt ];

		if ( typeof label !== 'string' || ! HOUR_LABEL.test( label ) ) {
			return;
		}

		const hour = Number( label );

		if ( hour < HOURS_IN_DAY ) {
			views[ hour ] = safeParseFloat( row[ viewsAt ] );
		}
	} );

	const responseStartDate = getDatePart( payload.start_date );
	const responseDate = getDatePart( payload.date );

	// Prefer the actual range returned by the endpoint and normalize datetime values.
	return {
		startDate: responseStartDate || getDatePart( query?.start_date ),
		date: responseDate || getDatePart( query?.date ),
		days,
		buckets: views.map( ( value, hour ) => ( { hour, views: value } ) ),
	};
}
