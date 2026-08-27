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

export type StatsInsightsHourlyViews = Record< string, number >;

type StatsInsightsData = {
	/**
	 * Peak weekday as the endpoint reports it: a Monday-based index, which the
	 * WordPress locale table (Sunday-based) does not share. Kept numeric so the
	 * label is built in the site's locale where it is rendered.
	 */
	dayOfWeek: number;
	percent: number;
	/** Peak hour of the day, 0-23, in the site's timezone. */
	hourOfDay: number;
	hourPercent: number;
	hourlyViews: StatsInsightsHourlyViews;
	years: StatsInsightsYear[];
};

export type StatsInsightsResponse = Partial< StatsInsightsData >;

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

function normalizeHourlyViews( hourlyViews: unknown ): StatsInsightsHourlyViews {
	const payload = coerceStatsRecord( hourlyViews );

	return Object.fromEntries(
		Object.entries( payload ).map( ( [ key, value ] ) => [ key, safeParseInt( value ) ] )
	);
}

export function sanitizeStatsInsightsResponse( response: unknown ): StatsInsightsResponse {
	const payload = coerceStatsRecord( response );

	if ( typeof payload.highest_day_of_week !== 'number' ) {
		return {};
	}

	return {
		dayOfWeek: payload.highest_day_of_week,
		percent: Math.round( safeParseFloat( payload.highest_day_percent ) ),
		// A missing hour is not hour 0. Coercing it would report midnight as the
		// site's peak, which reads as a real answer rather than a missing one.
		...( typeof payload.highest_hour === 'number'
			? {
					hourOfDay: payload.highest_hour,
					hourPercent: Math.round( safeParseFloat( payload.highest_hour_percent ) ),
			  }
			: {} ),
		hourlyViews: normalizeHourlyViews( payload.hourly_views ),
		years: Array.isArray( payload.years ) ? payload.years.map( normalizeInsightsYear ) : [],
	};
}
