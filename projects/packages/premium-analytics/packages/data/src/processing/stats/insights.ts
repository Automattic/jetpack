import { safeParseFloat, safeParseInt } from '../../utils/parsing';
import { coerceStatsRecord } from './utils';

export type StatsInsightsYear = {
	year: string;
	total_posts: number;
	total_comments: number;
	avg_comments: number;
	total_likes: number;
	avg_likes: number;
	total_words: number;
	avg_words: number;
	total_images: number;
	avg_images: number;
};

/**
 * Views keyed by hour. Unlike `hourOfDay`, these keys are UTC — the endpoint
 * applies the site's offset to the peak hour but not to this map — so they are
 * not interchangeable and this one must not be fed to an hour formatter.
 */
export type StatsInsightsHourlyViews = Record< string, number >;

type StatsInsightsData = {
	/**
	 * Peak weekday as the endpoint reports it: a Monday-based index, which the
	 * WordPress locale table (Sunday-based) does not share. Kept numeric so the
	 * label is built in the site's locale where it is rendered.
	 */
	dayOfWeek: number;
	percent: number;
	/** Peak hour of the day, 0-23, with the site's offset already applied. */
	hourOfDay: number;
	hourPercent: number;
	hourlyViews: StatsInsightsHourlyViews;
	years: StatsInsightsYear[];
};

export type StatsInsightsResponse = Partial< StatsInsightsData >;

/**
 * Reads a bounded index, rejecting anything the endpoint would not have meant:
 * absent, non-numeric, or outside the range. Returning `undefined` rather than a
 * fallback keeps a missing field from reading as a real answer downstream.
 *
 * @param value - Raw payload value.
 * @param max   - Highest index the field may take.
 * @return The index, or `undefined` when the value cannot be one.
 */
function readIndex( value: unknown, max: number ): number | undefined {
	const parsed = safeParseInt( value, NaN );

	return Number.isInteger( parsed ) && parsed >= 0 && parsed <= max ? parsed : undefined;
}

function normalizeInsightsYear( year: unknown ): StatsInsightsYear {
	const payload = coerceStatsRecord( year );

	return {
		year: String( payload.year ?? '' ),
		total_posts: safeParseInt( payload.total_posts ),
		total_comments: safeParseInt( payload.total_comments ),
		avg_comments: safeParseFloat( payload.avg_comments ),
		total_likes: safeParseInt( payload.total_likes ),
		avg_likes: safeParseFloat( payload.avg_likes ),
		total_words: safeParseInt( payload.total_words ),
		avg_words: safeParseFloat( payload.avg_words ),
		total_images: safeParseInt( payload.total_images ),
		avg_images: safeParseFloat( payload.avg_images ),
	};
}

/**
 * Reads a share as a whole percent under the given key, or nothing at all.
 *
 * @param value - Raw payload value.
 * @param key   - Field name to emit it under.
 * @return A single-entry object, or an empty one when the share is absent.
 */
function readShare( value: unknown, key: 'percent' | 'hourPercent' ) {
	return value === undefined || value === null
		? {}
		: { [ key ]: Math.round( safeParseFloat( value ) ) };
}

function normalizeHourlyViews( hourlyViews: unknown ): StatsInsightsHourlyViews {
	const payload = coerceStatsRecord( hourlyViews );

	return Object.fromEntries(
		Object.entries( payload ).map( ( [ key, value ] ) => [ key, safeParseInt( value ) ] )
	);
}

export function sanitizeStatsInsightsResponse( response: unknown ): StatsInsightsResponse {
	const payload = coerceStatsRecord( response );
	const dayOfWeek = readIndex( payload.highest_day_of_week, 6 );

	if ( dayOfWeek === undefined ) {
		return {};
	}

	const hourOfDay = readIndex( payload.highest_hour, 23 );

	// Each field is omitted rather than defaulted when the payload lacks it: a
	// missing hour is not midnight and a missing share is not 0%, and either
	// coercion reads as a real answer instead of an absent one.
	return {
		dayOfWeek,
		...readShare( payload.highest_day_percent, 'percent' ),
		...( hourOfDay === undefined
			? {}
			: { hourOfDay, ...readShare( payload.highest_hour_percent, 'hourPercent' ) } ),
		hourlyViews: normalizeHourlyViews( payload.hourly_views ),
		years: Array.isArray( payload.years ) ? payload.years.map( normalizeInsightsYear ) : [],
	};
}
