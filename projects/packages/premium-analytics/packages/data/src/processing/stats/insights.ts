import { format } from 'date-fns';
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
	day: string;
	percent: number;
	hour: string;
	hourPercent: number;
	hourlyViews: StatsInsightsHourlyViews;
	years: StatsInsightsYear[];
};

export type StatsInsightsResponse = Partial< StatsInsightsData >;

function getDayName( highestDayOfWeek: number ) {
	const dayOfWeek = ( highestDayOfWeek + 1 ) % 7;
	const date = new Date( 2026, 0, 4 + dayOfWeek, 12 );

	return format( date, 'EEEE' );
}

function getHourLabel( hour: unknown ) {
	const date = new Date( 2026, 0, 4, safeParseInt( hour ) );

	return format( date, 'p' );
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
		day: getDayName( payload.highest_day_of_week ),
		percent: Math.round( safeParseFloat( payload.highest_day_percent ) ),
		hour: getHourLabel( payload.highest_hour ),
		hourPercent: Math.round( safeParseFloat( payload.highest_hour_percent ) ),
		hourlyViews: normalizeHourlyViews( payload.hourly_views ),
		years: Array.isArray( payload.years ) ? payload.years.map( normalizeInsightsYear ) : [],
	};
}
