import { addDays, differenceInCalendarWeeks, format, parseISO, startOfWeek } from 'date-fns';
import type { DataPointDate } from '../../../types';
import type { HeatmapCell, HeatmapColumn } from '../types';

export type CalendarHeatmapResult = {
	data: HeatmapColumn[];
	rowLabels: string[];
};

/** Rows that get a weekday label (Mon, Wed, Fri with a Monday week start). */
const LABELLED_ROWS = [ 0, 2, 4 ];

/**
 * Resolve one grid bound: an unparseable or narrowing value falls back to the
 * series' own bound, so the grid can only ever be widened.
 *
 * @param bound     - Requested bound as `yyyy-MM-dd`, if any.
 * @param fallback  - The series' own bound on this side.
 * @param direction - Which way the bound is allowed to move.
 * @return The bound to draw to.
 */
const widenTo = (
	bound: string | undefined,
	fallback: Date,
	direction: 'earlier' | 'later'
): Date => {
	if ( ! bound ) {
		return fallback;
	}

	const parsed = parseISO( bound );
	if ( isNaN( parsed.getTime() ) ) {
		return fallback;
	}

	if ( direction === 'earlier' ) {
		return parsed < fallback ? parsed : fallback;
	}

	return parsed > fallback ? parsed : fallback;
};

const toDate = ( point: DataPointDate ): Date | null => {
	if ( point.date instanceof Date && ! isNaN( point.date.getTime() ) ) {
		return point.date;
	}
	if ( point.dateString ) {
		const parsed = parseISO( point.dateString );
		if ( ! isNaN( parsed.getTime() ) ) {
			return parsed;
		}
	}
	return null;
};

// Labels stay English on the browser's calendar, unlike the time axis: this is a
// plain function the host calls outside the provider, so `GlobalChartsProvider`'s
// `locale` and `timeZone` cannot reach it. CHARTS-266 has the detail.
export const buildCalendarHeatmapData = (
	series: DataPointDate[],
	options: {
		weekStartsOn?: 0 | 1;
		/**
		 * Mark the days completing the first/last week outside the series'
		 * date span as hidden cells (empty grid slots) instead of blank
		 * cells, giving the calendar ragged edges. Days inside the span stay
		 * blank cells even when the series has no entry for them.
		 */
		hideOutOfRangeDays?: boolean;
		/**
		 * Draw the grid over this span (`yyyy-MM-dd` bounds) instead of the
		 * series' own. Days inside the grid but outside the series become
		 * placeholder cells: painted as empty slots so a short series still
		 * fills its container, but reporting nothing, since they were never
		 * measured. A start bound is drawn from the beginning of its week, so
		 * the grid always opens on a whole column. Bounds narrower than the
		 * series are ignored — the grid never drops a day that carries data.
		 */
		gridSpan?: { start?: string; end?: string };
	} = {}
): CalendarHeatmapResult => {
	const weekStartsOn = options.weekStartsOn ?? 1;
	const hideOutOfRangeDays = options.hideOutOfRangeDays ?? true;

	const entries = series
		.map( point => ( { date: toDate( point ), value: point.value } ) )
		.filter( ( entry ): entry is { date: Date; value: number | null } => entry.date !== null );

	if ( ! entries.length ) {
		return { data: [], rowLabels: [] };
	}

	const valueByDay = new Map< string, number | null >();
	let minDate = entries[ 0 ].date;
	let maxDate = entries[ 0 ].date;
	for ( const { date, value } of entries ) {
		valueByDay.set( format( date, 'yyyy-MM-dd' ), value );
		if ( date < minDate ) {
			minDate = date;
		}
		if ( date > maxDate ) {
			maxDate = date;
		}
	}

	// Day-key bounds for the ragged-edge option: calendar-day comparison, so
	// entries carrying a time of day can't shift the span.
	const minDayKey = format( minDate, 'yyyy-MM-dd' );
	const maxDayKey = format( maxDate, 'yyyy-MM-dd' );

	// The grid may run wider than the series, never narrower: a bound that would
	// cut into the data is dropped rather than honoured.
	const gridMinDate = widenTo( options.gridSpan?.start, minDate, 'earlier' );
	const gridMaxDate = widenTo( options.gridSpan?.end, maxDate, 'later' );

	const gridMaxDayKey = format( gridMaxDate, 'yyyy-MM-dd' );

	const gridStart = startOfWeek( gridMinDate, { weekStartsOn } );

	// A start bound rarely lands on a week start, and `gridStart` rounds it down.
	// The days it rounds past were no more measured than the rest of the widened
	// span, so they are filler too; treating them as a ragged edge instead would
	// notch the first column by however far the bound sat into its week.
	const gridMinDayKey = format( gridMinDate < minDate ? gridStart : gridMinDate, 'yyyy-MM-dd' );
	const weekCount = differenceInCalendarWeeks( gridMaxDate, gridStart, { weekStartsOn } ) + 1;

	const rowLabels = Array.from( { length: 7 }, ( _, row ) =>
		LABELLED_ROWS.includes( row ) ? format( addDays( gridStart, row ), 'EEE' ) : ''
	);

	// Hide short partial first-month labels when a later month follows; compact
	// cells make adjacent labels collide. Keep the label for single-month ranges.
	const MIN_FIRST_MONTH_WEEKS = 2;
	const firstMonth = gridStart.getMonth();
	let firstMonthWeeks = 0;
	while (
		firstMonthWeeks < weekCount &&
		addDays( gridStart, firstMonthWeeks * 7 ).getMonth() === firstMonth
	) {
		firstMonthWeeks++;
	}
	const spansLaterMonth = firstMonthWeeks < weekCount;
	const showFirstMonthLabel = ! spansLaterMonth || firstMonthWeeks >= MIN_FIRST_MONTH_WEEKS;

	const data: HeatmapColumn[] = [];
	let previousMonth = -1;
	for ( let week = 0; week < weekCount; week++ ) {
		const columnStart = addDays( gridStart, week * 7 );
		const month = columnStart.getMonth();
		const isNewMonth = month !== previousMonth;
		const label =
			isNewMonth && ( week !== 0 || showFirstMonthLabel ) ? format( columnStart, 'MMM' ) : '';
		previousMonth = month;

		const cells: HeatmapCell[] = [];
		for ( let row = 0; row < 7; row++ ) {
			const day = addDays( gridStart, week * 7 + row );
			const key = format( day, 'yyyy-MM-dd' );
			const cell: HeatmapCell = {
				label: format( day, 'EEE, MMM d, yyyy' ),
				value: valueByDay.has( key ) ? ( valueByDay.get( key ) as number | null ) : null,
			};
			if ( key < gridMinDayKey || key > gridMaxDayKey ) {
				// The days completing the grid's first/last week: the calendar's
				// ragged edge.
				if ( hideOutOfRangeDays ) {
					cell.hidden = true;
				}
			} else if ( key < minDayKey || key > maxDayKey ) {
				// Inside the grid the caller asked for, outside the series: filler.
				cell.placeholder = true;
			}
			cells.push( cell );
		}
		data.push( { label, data: cells } );
	}

	return { data, rowLabels };
};
