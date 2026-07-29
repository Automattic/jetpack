import { getSiteData } from '@automattic/jetpack-script-data';
import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import type { ChartGranularity, StatsPeriod } from './placeholder-data';

/** One point on the subscribers chart. */
export type SubscriberSeriesPoint = {
	date: Date;
	value: number;
};

type SubscribersCountsResponse = {
	counts?: {
		total_subscribers?: number;
		all_subscribers?: number;
		email_subscribers?: number;
		social_followers?: number;
	};
};

type SubscribersSeriesResponse = {
	fields?: string[];
	data?: Array< Array< string | number | null > >;
};

type SubscribersQueryParams = {
	unit: 'day' | 'week' | 'month' | 'year';
	quantity: number;
	date: string;
};

type State = {
	totalSubscribers: number | null;
	series: SubscriberSeriesPoint[];
	isLoading: boolean;
};

const GRANULARITY_UNITS: Record< ChartGranularity, SubscribersQueryParams[ 'unit' ] > = {
	days: 'day',
	weeks: 'week',
	months: 'month',
	years: 'year',
};

const PERIOD_QUANTITIES: Record<
	StatsPeriod,
	Record< SubscribersQueryParams[ 'unit' ], number >
> = {
	'7d': { day: 7, week: 1, month: 1, year: 1 },
	'30d': { day: 30, week: 5, month: 1, year: 1 },
	'90d': { day: 90, week: 13, month: 3, year: 1 },
	year: { day: 365, week: 52, month: 12, year: 1 },
};

/**
 * The end date for Stats quantity-based requests.
 *
 * @return Date string in the shape WPCOM expects.
 */
function getToday(): string {
	return new Date().toISOString().slice( 0, 10 );
}

/**
 * Translate the Dashboard's period + cadence controls into the Stats subscribers
 * endpoint's quantity-based query.
 *
 * @param period      - Dashboard range.
 * @param granularity - Bucket size selected for the chart.
 * @return Query params for `/stats/subscribers`.
 */
export function getSubscriberSeriesQuery(
	period: StatsPeriod,
	granularity: ChartGranularity
): SubscribersQueryParams {
	const unit = GRANULARITY_UNITS[ granularity ];
	const quantity = PERIOD_QUANTITIES[ period ][ unit ];

	return { unit, quantity, date: getToday() };
}

/**
 * Parse a WPCOM period string into a Date.
 *
 * @param period - Period string from the matrix response.
 * @return A Date, or undefined when the period cannot be parsed.
 */
function parsePeriod( period: string ): Date | undefined {
	let date: Date;
	const weekly = period.match( /^(\d{4})W(\d{2})W(\d{2})$/ );

	if ( weekly ) {
		date = new Date( `${ weekly[ 1 ] }-${ weekly[ 2 ] }-${ weekly[ 3 ] }T00:00:00Z` );
	} else if ( /^\d{4}-\d{2}$/.test( period ) ) {
		date = new Date( `${ period }-01T00:00:00Z` );
	} else if ( /^\d{4}$/.test( period ) ) {
		date = new Date( `${ period }-01-01T00:00:00Z` );
	} else {
		date = new Date( `${ period }T00:00:00Z` );
	}

	return Number.isNaN( date.getTime() ) ? undefined : date;
}

/**
 * Normalize numeric fields from Stats matrix rows.
 *
 * @param value - Raw metric value.
 * @return The numeric value, or undefined when it cannot be parsed.
 */
function parseMetricValue( value: string | number | null | undefined ): number | undefined {
	if ( typeof value === 'number' ) {
		return value;
	}

	if ( typeof value !== 'string' ) {
		return undefined;
	}

	const parsed = Number( value );

	return Number.isFinite( parsed ) ? parsed : undefined;
}

/**
 * Normalize the WPCOM matrix response into `LineChart` points.
 *
 * @param response - Raw response from `/stats/subscribers`.
 * @return Points oldest-first.
 */
export function normalizeSubscriberSeries(
	response: SubscribersSeriesResponse | undefined
): SubscriberSeriesPoint[] {
	const fields = response?.fields ?? [];
	const rows = response?.data ?? [];
	const periodIndex = fields.indexOf( 'period' );
	const subscribersIndex = fields.indexOf( 'subscribers' );
	const valueIndex = fields.indexOf( 'value' );
	const dateIndex = periodIndex >= 0 ? periodIndex : 0;
	let countIndex = 1;

	if ( subscribersIndex >= 0 ) {
		countIndex = subscribersIndex;
	} else if ( valueIndex >= 0 ) {
		countIndex = valueIndex;
	}

	return rows
		.map( row => {
			const rawDate = row[ dateIndex ];
			const rawValue = row[ countIndex ];
			const value = parseMetricValue( rawValue );

			if ( typeof rawDate !== 'string' || value === undefined ) {
				return undefined;
			}

			const date = parsePeriod( rawDate );

			return date ? { date, value } : undefined;
		} )
		.filter( ( point ): point is SubscriberSeriesPoint => point !== undefined )
		.sort( ( a, b ) => a.date.getTime() - b.date.getTime() );
}

/**
 * Extract the total subscriber count from either subscribers/counts shape.
 *
 * @param response - Raw count response.
 * @return Total subscribers, or null when unavailable.
 */
export function normalizeSubscriberCount(
	response: SubscribersCountsResponse | undefined
): number | null {
	const counts = response?.counts;

	if ( ! counts ) {
		return null;
	}

	if ( typeof counts.total_subscribers === 'number' ) {
		return counts.total_subscribers;
	}

	if ( typeof counts.all_subscribers === 'number' ) {
		return counts.all_subscribers;
	}

	if (
		typeof counts.email_subscribers === 'number' ||
		typeof counts.social_followers === 'number'
	) {
		return ( counts.email_subscribers ?? 0 ) + ( counts.social_followers ?? 0 );
	}

	return null;
}

/**
 * Fetch total subscribers and the subscribers-over-time series.
 *
 * @param period      - Dashboard range.
 * @param granularity - Chart cadence.
 * @return Subscriber stats state.
 */
export function useSubscriberStats( period: StatsPeriod, granularity: ChartGranularity ): State {
	const blogId = getSiteData()?.wpcom?.blog_id;

	const countsQuery = useQuery< number | null, Error >( {
		queryKey: [ 'newsletter-subscriber-counts', blogId ],
		queryFn: async () => {
			if ( ! blogId ) {
				return null;
			}

			try {
				const response = await apiFetch< SubscribersCountsResponse >( {
					path: addQueryArgs( `/jetpack/v4/stats-app/sites/${ blogId }/subscribers/counts`, {
						subscriber_status: 'active',
						subscription_status: 'active',
					} ),
				} );

				return normalizeSubscriberCount( response );
			} catch {
				return null;
			}
		},
	} );

	const seriesQuery = useQuery< SubscriberSeriesPoint[], Error >( {
		queryKey: [ 'newsletter-subscriber-series', blogId, period, granularity ],
		queryFn: async () => {
			if ( ! blogId ) {
				return [];
			}

			try {
				const params = getSubscriberSeriesQuery( period, granularity );
				const response = await apiFetch< SubscribersSeriesResponse >( {
					path: addQueryArgs( `/jetpack/v4/stats-app/sites/${ blogId }/stats/subscribers`, {
						...params,
						stat_fields: 'subscribers,subscribers_paid',
					} ),
				} );

				return normalizeSubscriberSeries( response );
			} catch {
				return [];
			}
		},
		placeholderData: previousData => previousData,
	} );

	return {
		totalSubscribers: countsQuery.data ?? null,
		series: seriesQuery.data ?? [],
		isLoading: seriesQuery.isLoading,
	};
}
