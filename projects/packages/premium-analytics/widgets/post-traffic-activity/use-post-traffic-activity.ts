/**
 * External dependencies
 */
import { useStatsPost, type ReportParams } from '@jetpack-premium-analytics/data';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import {
	addDays,
	eachDayOfInterval,
	endOfWeek,
	format,
	parseISO,
	startOfWeek,
	subDays,
} from 'date-fns';
import type { DataPointDate } from '@jetpack-premium-analytics/widgets-toolkit';

/**
 * Normalized activity state: one point per calendar day of the visible page
 * plus paging controls and the request's load/error flags. `hasData`
 * distinguishes the first load from refetches.
 */
export interface PostTrafficActivityState {
	days: DataPointDate[];
	/** Whether the selected range exceeds one page (shows the pager). */
	isPaged: boolean;
	/** Whether an older page exists inside the selected range. */
	canShowOlder: boolean;
	/** Whether a newer page exists (the newest page is shown first). */
	canShowNewer: boolean;
	showOlder: () => void;
	showNewer: () => void;
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
 * params and expose one page of it. The caller derives `pageSpanDays` from
 * the card width (whole week columns that fit), so one page always fills the
 * card exactly: a range at or under one page pads backward to
 * `range end − (pageSpanDays − 1)` with blank filler weeks, and a longer
 * range is paged — the newest page shows first and the header arrows step
 * through the range one page at a time. Days without traffic — and, on a
 * short range, the backward-padding filler before the range — carry `null`:
 * the design renders them as blank cells rather than zero labels. Days past
 * the range end (and, when paging, before the range start) are omitted
 * entirely, so the chart renders their week-completion slots as ragged
 * edges instead of blanks.
 *
 * @param postId       - The scoped post ID (0 disables the request).
 * @param reportParams - The dashboard date range.
 * @param pageSpanDays - Days one page spans (a whole number of weeks).
 * @return The visible page's daily points, paging controls, and load/error state.
 */
export default function usePostTrafficActivity(
	postId: number,
	reportParams: ReportParams,
	pageSpanDays: number
): PostTrafficActivityState {
	const { data, isLoading, isFetching, isError, refetch } = useStatsPost( {
		postId,
		fields: [ 'data' ],
	} );

	// Pages step back from the range end; a new range (or a resize that
	// changes the page span) starts back at the newest page.
	const [ pageOffset, setPageOffset ] = useState( 0 );
	useEffect( () => {
		setPageOffset( 0 );
	}, [ reportParams.from, reportParams.to, pageSpanDays ] );

	const from = toDay( reportParams.from );
	const to = toDay( reportParams.to );

	const { days, isPaged, canShowOlder } = useMemo( () => {
		if ( ! from || ! to || from > to ) {
			return { days: [] as DataPointDate[], isPaged: false, canShowOlder: false };
		}

		const history = data?.data ?? [];
		const viewsByDay = new Map( history.map( day => [ day.date, day.views ] ) );

		// Pages snap to week boundaries: the chart grids Monday-start week
		// columns from the window's first week, so an unaligned window would
		// span one more column than the width measurement sized the card for.
		// With both bounds aligned, a page is exactly `pageSpanDays / 7`
		// columns; the days past the range edges inside those weeks stay
		// blank filler.
		const firstWeekStart = startOfWeek( parseISO( from ), { weekStartsOn: 1 } );
		const newestPageEnd = endOfWeek( parseISO( to ), { weekStartsOn: 1 } );
		const paged = firstWeekStart < subDays( newestPageEnd, pageSpanDays - 1 );

		let pageEnd = subDays( newestPageEnd, pageOffset * pageSpanDays );
		let pageStart = subDays( pageEnd, pageSpanDays - 1 );

		// The oldest page of a paged range clamps to the range's first week
		// and fills forward (overlapping the previous page), instead of
		// padding months of out-of-range blanks before it. Short ranges keep
		// padding backward from the range end so the grid still fills the card.
		if ( paged && pageStart < firstWeekStart ) {
			pageStart = firstWeekStart;
			const clampedEnd = addDays( firstWeekStart, pageSpanDays - 1 );
			pageEnd = clampedEnd < newestPageEnd ? clampedEnd : newestPageEnd;
		}

		// Trim the emitted days to what should render as cells; the chart
		// hides the week-completion slots outside them (ragged edges). Days
		// past the range end always drop. Days before the range start drop
		// only when paging — a short range keeps its backward padding, since
		// those blanks are what fill the card.
		const rangeStart = parseISO( from );
		const rangeEnd = parseISO( to );
		const visibleStart = paged && rangeStart > pageStart ? rangeStart : pageStart;
		const visibleEnd = rangeEnd < pageEnd ? rangeEnd : pageEnd;

		const points = eachDayOfInterval( { start: visibleStart, end: visibleEnd } ).map( date => {
			const dateString = format( date, 'yyyy-MM-dd' );
			const inRange = dateString >= from && dateString <= to;
			const views = inRange ? viewsByDay.get( dateString ) : undefined;

			// Blank (null) for no-traffic and filler days, per the design —
			// not a `0` label.
			return { dateString, value: views ? views : null };
		} );

		return {
			days: points,
			isPaged: paged,
			canShowOlder: firstWeekStart < pageStart,
		};
	}, [ data, from, to, pageOffset, pageSpanDays ] );

	const showOlder = useCallback( () => {
		setPageOffset( offset => ( canShowOlder ? offset + 1 : offset ) );
	}, [ canShowOlder ] );

	const showNewer = useCallback( () => {
		setPageOffset( offset => Math.max( 0, offset - 1 ) );
	}, [] );

	return {
		days,
		isPaged,
		canShowOlder,
		canShowNewer: pageOffset > 0,
		showOlder,
		showNewer,
		isLoading,
		isFetching,
		isError,
		hasData: !! data,
		refetch,
	};
}
