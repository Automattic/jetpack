import { safeParseFloat } from '../../utils/parsing';
import { coerceStatsArray, coerceStatsRecord, isStatsRecord } from './utils';

export type StatsPostMonthValues = Record< string, number >;

export type StatsPostYear = {
	total?: number;
	overall?: number;
	months: StatsPostMonthValues;
};

export type StatsPostWeekDay = {
	day?: string;
	count: number;
};

export type StatsPostWeek = {
	days: StatsPostWeekDay[];
	total?: number;
	average?: number;
	change?: number;
};

export type StatsPostRawResponse = {
	date?: string;
	views?: unknown;
	years?: unknown;
	averages?: unknown;
	weeks?: unknown;
	highest_month?: unknown;
	highest_day_average?: unknown;
	highest_week_average?: unknown;
	post?: unknown;
};

export type StatsPostResponse = {
	date?: string;
	views?: number;
	years?: Record< string, StatsPostYear >;
	averages?: Record< string, StatsPostYear >;
	weeks?: StatsPostWeek[];
	highest_month?: number;
	highest_day_average?: number;
	highest_week_average?: number;
	post?: unknown;
};

function normalizeStatsPostYear( value: unknown ): StatsPostYear {
	const year = coerceStatsRecord( value );
	const months = coerceStatsRecord( year.months );

	return {
		...( year.total !== undefined ? { total: safeParseFloat( year.total ) } : {} ),
		...( year.overall !== undefined ? { overall: safeParseFloat( year.overall ) } : {} ),
		months: Object.fromEntries(
			Object.entries( months ).map( ( [ month, count ] ) => [ month, safeParseFloat( count ) ] )
		),
	};
}

function normalizeStatsPostYears( value: unknown ) {
	const years = coerceStatsRecord( value );

	return Object.fromEntries(
		Object.entries( years ).map( ( [ year, stats ] ) => [ year, normalizeStatsPostYear( stats ) ] )
	);
}

function normalizeStatsPostWeek( value: unknown ): StatsPostWeek {
	const week = coerceStatsRecord( value );

	return {
		days: coerceStatsArray( week.days ).map( day => {
			const item = coerceStatsRecord( day );

			return {
				...( typeof item.day === 'string' ? { day: item.day } : {} ),
				count: safeParseFloat( item.count ),
			};
		} ),
		...( week.total !== undefined ? { total: safeParseFloat( week.total ) } : {} ),
		...( week.average !== undefined ? { average: safeParseFloat( week.average ) } : {} ),
		...( week.change !== undefined ? { change: safeParseFloat( week.change ) } : {} ),
	};
}

export function sanitizeStatsPostResponse( response: unknown ): StatsPostResponse {
	if ( ! isStatsRecord( response ) ) {
		return {};
	}

	const payload = coerceStatsRecord( response );

	return {
		...( typeof payload.date === 'string' ? { date: payload.date } : {} ),
		...( payload.views !== undefined ? { views: safeParseFloat( payload.views ) } : {} ),
		...( payload.years !== undefined ? { years: normalizeStatsPostYears( payload.years ) } : {} ),
		...( payload.averages !== undefined
			? { averages: normalizeStatsPostYears( payload.averages ) }
			: {} ),
		...( payload.weeks !== undefined
			? { weeks: coerceStatsArray( payload.weeks ).map( normalizeStatsPostWeek ) }
			: {} ),
		...( payload.highest_month !== undefined
			? { highest_month: safeParseFloat( payload.highest_month ) }
			: {} ),
		...( payload.highest_day_average !== undefined
			? { highest_day_average: safeParseFloat( payload.highest_day_average ) }
			: {} ),
		...( payload.highest_week_average !== undefined
			? { highest_week_average: safeParseFloat( payload.highest_week_average ) }
			: {} ),
		...( payload.post !== undefined ? { post: payload.post } : {} ),
	};
}
