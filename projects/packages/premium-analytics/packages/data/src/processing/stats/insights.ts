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
 * Views keyed by the hour bucket's own timestamp (`2022-11-26 04:00:00`), not
 * by hour of day: each key names one dated hour, so they are not
 * interchangeable with `hourOfDay` and must not be fed to an hour formatter.
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
 * Bounded like `readIndex`, and rejecting junk rather than only absent values:
 * a share that fell back to 0 would caption a real peak with "0% of views", and
 * one outside 0-100 is not a measurement either — the caption formats with
 * `signDisplay: 'never'`, so a negative share would read as a plausible
 * positive percent.
 *
 * @param value - Raw payload value.
 * @return The whole percent, or `undefined` when the value cannot be one.
 */
function readShare( value: unknown ): number | undefined {
	const parsed = readNumber( value );

	// Bounded before rounding, not after: `Math.round( -0.2 )` is `-0`, which
	// passes a `>= 0` test and captions a peak with "0% of views".
	return parsed !== undefined && parsed >= 0 && parsed <= 100 ? Math.round( parsed ) : undefined;
}

/**
 * Reads one peak (its index and share of views) as a unit.
 *
 * A share of 0 is the endpoint's default for a window with no views, and its
 * index is just the first empty bucket.
 *
 * @param index - Raw peak index.
 * @param max   - Highest index the field may take.
 * @param share - Raw share of views.
 * @return The parts that are measurements; empty when the window had no views.
 */
function readPeak(
	index: unknown,
	max: number,
	share: unknown
): { index?: number; share?: number } {
	if ( readNumber( share ) === 0 ) {
		return {};
	}

	return { index: readIndex( index, max ), share: readShare( share ) };
}

function normalizeHourlyViews( hourlyViews: unknown ): StatsInsightsHourlyViews {
	const payload = coerceStatsRecord( hourlyViews );

	return Object.fromEntries(
		Object.entries( payload ).map( ( [ key, value ] ) => [ key, safeParseInt( value ) ] )
	);
}

export function sanitizeStatsInsightsResponse( response: unknown ): StatsInsightsResponse {
	const payload = coerceStatsRecord( response );
	const { index: dayOfWeek, share: percent } = readPeak(
		payload.highest_day_of_week,
		6,
		payload.highest_day_percent
	);
	const { index: hourOfDay, share: hourPercent } = readPeak(
		payload.highest_hour,
		23,
		payload.highest_hour_percent
	);

	// Each peak and the year totals stand or fall on their own. One report feeds
	// two widgets — the peak highlights and Year in review's per-year totals — so
	// a site with years but no peak day must not lose its years to the missing
	// peak. A missing hour is not midnight and a missing share is not 0%: either
	// coercion reads as a real answer rather than an absent one. Which highlights
	// an absent field hides is the widget's call, not this one's.
	return {
		...( dayOfWeek === undefined ? {} : { dayOfWeek } ),
		...( percent === undefined ? {} : { percent } ),
		...( hourOfDay === undefined ? {} : { hourOfDay } ),
		...( hourPercent === undefined ? {} : { hourPercent } ),
		hourlyViews: normalizeHourlyViews( payload.hourly_views ),
		years: Array.isArray( payload.years ) ? payload.years.map( normalizeInsightsYear ) : [],
	};
}
