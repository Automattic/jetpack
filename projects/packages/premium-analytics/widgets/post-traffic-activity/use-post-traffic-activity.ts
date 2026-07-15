/**
 * External dependencies
 */
import { useStatsPost, type ReportParams } from '@jetpack-premium-analytics/data';
import { useMemo } from '@wordpress/element';
import { eachDayOfInterval, format, parseISO, subDays } from 'date-fns';
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
 * Days the grid spans for short ranges (24 week columns). The design fills
 * the card with blank cells even when the selected range is short, so the
 * grid's first day is anchored at `range end − (GRID_SPAN_DAYS − 1)` and the
 * gap back to it is padded with blank filler weeks; values still render only
 * inside the selected range. Selections longer than the span use their own
 * length instead (the cell-width floor turns that into horizontal scroll).
 * At the chart's 44–88px cell-width bounds, 24 columns cover roughly
 * 1050–2100px of card width.
 */
const GRID_SPAN_DAYS = 168;

/**
 * Fetch the scoped post's daily view activity for the dashboard's report
 * params. Every calendar day of the grid gets a point so the heatmap stays
 * complete, but days without traffic — and the backfilled padding before a
 * short range — carry `null`: the design renders them as blank cells rather
 * than zero labels.
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

		// Pad short ranges backward to the span's first day so the grid fills
		// the card; the filler days stay blank regardless of history.
		const end = parseISO( to );
		const rangeStart = parseISO( from );
		const paddedStart = subDays( end, GRID_SPAN_DAYS - 1 );
		const gridStart = rangeStart < paddedStart ? rangeStart : paddedStart;

		return eachDayOfInterval( { start: gridStart, end } ).map( date => {
			const dateString = format( date, 'yyyy-MM-dd' );
			const inRange = dateString >= from && dateString <= to;
			const views = inRange ? viewsByDay.get( dateString ) : undefined;

			// Blank (null) for no-traffic and filler days, per the design —
			// not a `0` label.
			return { dateString, value: views ? views : null };
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
