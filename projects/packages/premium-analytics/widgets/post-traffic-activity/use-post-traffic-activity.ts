/**
 * External dependencies
 */
import { useStatsPost, type ReportParams } from '@jetpack-premium-analytics/data';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { eachDayOfInterval, format, parseISO, subDays } from 'date-fns';
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
 * Days one heatmap page spans (24 week columns). The design fills the card
 * with blank cells even when the selected range is short, so a range at or
 * under one page pads backward to `range end − (PAGE_SPAN_DAYS − 1)` with
 * blank filler weeks. A longer range is paged: the newest page shows first
 * and the header arrows step through the range one page at a time, the
 * oldest page padding backward the same way. Values always render only
 * inside the selected range. At the chart's 44–64px cell-width bounds, 24
 * columns cover roughly 1050–1550px of card width.
 */
const PAGE_SPAN_DAYS = 168;

/**
 * Fetch the scoped post's daily view activity for the dashboard's report
 * params and expose one page of it. Every calendar day of the page gets a
 * point so the heatmap grid stays complete, but days without traffic — and
 * filler days outside the selected range — carry `null`: the design renders
 * them as blank cells rather than zero labels.
 *
 * @param postId       - The scoped post ID (0 disables the request).
 * @param reportParams - The dashboard date range.
 * @return The visible page's daily points, paging controls, and load/error state.
 */
export default function usePostTrafficActivity(
	postId: number,
	reportParams: ReportParams
): PostTrafficActivityState {
	const { data, isLoading, isFetching, isError, refetch } = useStatsPost( {
		postId,
		fields: [ 'data' ],
	} );

	// Pages step back from the range end; a new range starts at the newest page.
	const [ pageOffset, setPageOffset ] = useState( 0 );
	useEffect( () => {
		setPageOffset( 0 );
	}, [ reportParams.from, reportParams.to ] );

	const from = toDay( reportParams.from );
	const to = toDay( reportParams.to );

	const { days, isPaged, canShowOlder } = useMemo( () => {
		if ( ! from || ! to || from > to ) {
			return { days: [] as DataPointDate[], isPaged: false, canShowOlder: false };
		}

		const history = data?.data ?? [];
		const viewsByDay = new Map( history.map( day => [ day.date, day.views ] ) );

		const rangeStart = parseISO( from );
		const pageEnd = subDays( parseISO( to ), pageOffset * PAGE_SPAN_DAYS );
		const pageStart = subDays( pageEnd, PAGE_SPAN_DAYS - 1 );

		const points = eachDayOfInterval( { start: pageStart, end: pageEnd } ).map( date => {
			const dateString = format( date, 'yyyy-MM-dd' );
			const inRange = dateString >= from && dateString <= to;
			const views = inRange ? viewsByDay.get( dateString ) : undefined;

			// Blank (null) for no-traffic and filler days, per the design —
			// not a `0` label.
			return { dateString, value: views ? views : null };
		} );

		return {
			days: points,
			isPaged: rangeStart < subDays( parseISO( to ), PAGE_SPAN_DAYS - 1 ),
			canShowOlder: rangeStart < pageStart,
		};
	}, [ data, from, to, pageOffset ] );

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
