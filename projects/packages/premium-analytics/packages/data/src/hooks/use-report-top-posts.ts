/**
 * External dependencies
 */
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, startOfMonth, startOfWeek, startOfYear } from 'date-fns';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { fetchReportTopPosts } from '../api/report-top-posts-fetch';
import type { TopPostsPeriod, TopPostsResponse } from '../api/report-top-posts-fetch';

export type UseReportTopPostsParams = {
	period: TopPostsPeriod;
	/**
	 * Reference date within the period, YYYY-MM-DD.
	 */
	date: string;
	/**
	 * Maximum number of posts to return.
	 */
	num?: number;
	/**
	 * Filter kind. Only `postType` is supported in v1.
	 */
	kind?: 'postType';
	/**
	 * Post type(s) to keep, e.g. `'post'`, `'page'`, `[ 'post', 'page' ]`.
	 * When undefined, no filtering is applied.
	 */
	name?: string | string[];
};

type UseReportTopPostsOptions = {
	enabled?: boolean;
};

export type TopPostRow = {
	label: string;
	value: number;
	href: string;
	type: string;
};

/**
 * Compute the start date of the stats period containing `date`, which is the
 * key the WPCOM stats API uses for the matching bucket in `days`. Port of
 * Calypso's `rangeOfPeriod` (wp-calypso `client/state/stats/lists/utils.js`),
 * start side only.
 *
 * @param period - Stats period granularity.
 * @param date   - Reference date, YYYY-MM-DD.
 */
function periodStartDate( period: TopPostsPeriod, date: string ): string {
	const parsed = parseISO( date );

	switch ( period ) {
		case 'week':
			// WPCOM stats weeks run Monday through Sunday.
			return format( startOfWeek( parsed, { weekStartsOn: 1 } ), 'yyyy-MM-dd' );
		case 'month':
			return format( startOfMonth( parsed ), 'yyyy-MM-dd' );
		case 'year':
			return format( startOfYear( parsed ), 'yyyy-MM-dd' );
		case 'day':
		default:
			return date;
	}
}

/**
 * Normalize a WPCOM top-posts response into flat rows. Port of Calypso's
 * `statsTopPosts` normalizer (wp-calypso `client/state/stats/lists/utils.js`)
 * minus the Calypso UI fields.
 *
 * @param response - Raw top-posts response.
 * @param period   - Stats period granularity used in the request.
 * @param date     - Reference date used in the request, YYYY-MM-DD.
 */
function normalizeTopPosts(
	response: TopPostsResponse,
	period: TopPostsPeriod,
	date: string
): TopPostRow[] {
	const bucket = response.days?.[ periodStartDate( period, date ) ];

	return ( bucket?.postviews ?? [] ).map( item => ( {
		label: item.title,
		value: item.views,
		href: item.href,
		type: item.type,
	} ) );
}

/**
 * Fetch the top-viewed posts/pages for the site.
 *
 * Unlike the WooCommerce report hooks this uses `useQuery` directly — stats
 * has no comparison-period concept in v1, so `useReport` does not apply.
 *
 * @param params  - Report parameters.
 * @param options - Optional configuration.
 * @return The react-query result fields plus `rows`, the normalized
 *         `{ label, value, href, type }` rows filtered by `params.name`.
 */
export function useReportTopPosts(
	params: UseReportTopPostsParams,
	options?: UseReportTopPostsOptions
) {
	const { period, date, num, name } = params;

	const query = useQuery( {
		queryKey: [ 'stats', 'top-posts', period, date, num ?? null ],
		queryFn: () => fetchReportTopPosts( { period, date, num } ),
		enabled: options?.enabled ?? true,
	} );

	const nameKey = Array.isArray( name ) ? name.join( ',' ) : name;
	const { data } = query;

	const rows = useMemo( () => {
		if ( ! data ) {
			return [];
		}

		const allowedTypes = nameKey === undefined ? null : nameKey.split( ',' );

		return normalizeTopPosts( data, period, date ).filter(
			row => ! allowedTypes || allowedTypes.includes( row.type )
		);
	}, [ data, period, date, nameKey ] );

	return {
		data: query.data,
		isLoading: query.isLoading,
		isFetching: query.isFetching,
		isError: query.isError,
		error: query.error,
		refetch: query.refetch,
		rows,
	};
}
