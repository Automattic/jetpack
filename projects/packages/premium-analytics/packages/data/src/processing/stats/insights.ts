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
 * Reads a finite number, or nothing when the value cannot be one.
 *
 * Returning `undefined` rather than a fallback is the point: a coerced 0 is
 * indistinguishable downstream from a measured 0.
 *
 * @param value - Raw payload value.
 * @return The number, or `undefined`.
 */
function readNumber( value: unknown ): number | undefined {
	// Numbers and numeric strings only — `Number` reads `[]` as 0 and `[5]` as 5,
	// so anything else is a shape the endpoint did not mean. `Number`, not
	// `parseInt`: parsing salvages a leading digit, so `3.9` or `6abc` would
	// truncate into a neighbouring value that looks like a real answer.
	if ( typeof value !== 'number' && typeof value !== 'string' ) {
		return undefined;
	}

	if ( typeof value === 'string' && value.trim() === '' ) {
		return undefined;
	}

	const parsed = Number( value );

	return Number.isFinite( parsed ) ? parsed : undefined;
}

/**
 * Reads a bounded whole index, rejecting anything outside the range.
 *
 * @param value - Raw payload value.
 * @param max   - Highest index the field may take.
 * @return The index, or `undefined` when the value cannot be one.
 */
function readIndex( value: unknown, max: number ): number | undefined {
	const parsed = readNumber( value );

	return parsed !== undefined && Number.isInteger( parsed ) && parsed >= 0 && parsed <= max
		? parsed
		: undefined;
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
 * Reads a share as a whole percent, or nothing when the payload has none.
 *
 * Rejects the same junk `readIndex` does rather than only absent values: a
 * share that fell back to 0 would caption a real peak with "0% of views", which
 * reads as a measurement rather than a gap.
 *
 * @param value - Raw payload value.
 * @return The whole percent, or `undefined` when the value cannot be one.
 */
function readShare( value: unknown ): number | undefined {
	const parsed = readNumber( value );

	return parsed === undefined ? undefined : Math.round( parsed );
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
	const hourOfDay = readIndex( payload.highest_hour, 23 );
	const percent = readShare( payload.highest_day_percent );
	const hourPercent = readShare( payload.highest_hour_percent );

	// Every field stands or falls on its own. One report feeds two widgets — the
	// peak highlights and Annual highlights' per-year totals — so a site with
	// years but no peak day must not lose its years to the missing peak. Within
	// the peak itself, a missing hour is not midnight and a missing share is not
	// 0%: either coercion reads as a real answer rather than an absent one.
	return {
		...( dayOfWeek === undefined
			? {}
			: { dayOfWeek, ...( percent === undefined ? {} : { percent } ) } ),
		...( dayOfWeek === undefined || hourOfDay === undefined
			? {}
			: { hourOfDay, ...( hourPercent === undefined ? {} : { hourPercent } ) } ),
		hourlyViews: normalizeHourlyViews( payload.hourly_views ),
		years: Array.isArray( payload.years ) ? payload.years.map( normalizeInsightsYear ) : [],
	};
}
