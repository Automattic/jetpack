/**
 * External dependencies
 */
import { useStatsPost, type ReportParams } from '@jetpack-premium-analytics/data';
import { useMemo } from '@wordpress/element';
import { eachDayOfInterval, format, parseISO } from 'date-fns';
import type { DataPointDate } from '@jetpack-premium-analytics/widgets-toolkit';

/**
 * Normalized activity state: one point per calendar day in the window plus
 * the request's load/error flags. `hasData` distinguishes the first load from
 * refetches.
 */
export interface PostTrafficActivityState {
	days: DataPointDate[];
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	hasData: boolean;
	refetch: () => void;
}

/**
 * Extract a shape-validated `YYYY-MM-DD` day from an ISO report param. The
 * params originate from URL search params; a malformed bound disables the
 * window rather than reaching `parseISO`/`eachDayOfInterval` (which throw).
 *
 * @param value - The ISO date-time string.
 * @return The date-only day, or undefined when missing/malformed.
 */
function toDay( value?: string ): string | undefined {
	const day = value?.slice( 0, 10 );
	return day && /^\d{4}-\d{2}-\d{2}$/.test( day ) && ! Number.isNaN( parseISO( day ).getTime() )
		? day
		: undefined;
}

/**
 * Fetch the scoped post's daily view activity for the dashboard's report
 * params. The `stats/post` daily history covers every day since publication
 * but omits zero-view days, so every calendar day of the window is
 * zero-seeded — the heatmap renders a complete grid, and pre-publication
 * days are genuinely zero views.
 *
 * @param postId       - The scoped post ID (0 disables the request).
 * @param reportParams - The dashboard date range.
 * @return The daily activity points and load/error state.
 */
export default function usePostTrafficActivity(
	postId: number,
	reportParams: ReportParams
): PostTrafficActivityState {
	const { data, isLoading, isFetching, isError, refetch } = useStatsPost( {
		postId,
		fields: [ 'data' ],
	} );

	const days = useMemo< DataPointDate[] >( () => {
		const history = data?.data ?? [];
		const from = toDay( reportParams.from );
		const to = toDay( reportParams.to );

		if ( ! from || ! to || from > to ) {
			return [];
		}

		const viewsByDay = new Map( history.map( day => [ day.date, day.views ] ) );

		return eachDayOfInterval( { start: parseISO( from ), end: parseISO( to ) } ).map( date => {
			const dateString = format( date, 'yyyy-MM-dd' );

			return { dateString, value: viewsByDay.get( dateString ) ?? 0 };
		} );
	}, [ data, reportParams.from, reportParams.to ] );

	return {
		days,
		isLoading,
		isFetching,
		isError,
		hasData: !! data,
		refetch,
	};
}
