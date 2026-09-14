import { createDateFormatter, sanitizeFormatting } from '../../../utils/date-formatting';
import { warnOnce } from '../../../utils/warn-once';
import {
	addCivilDays,
	civilDate,
	civilKey,
	civilWeekSpan,
	instantDayReader,
	pointDayKey,
	startOfCivilWeek,
	writtenDayKey,
} from './civil-day';
import type { DataPointDate } from '../../../types';
import type { HeatmapCell, HeatmapColumn } from '../types';
import type { CivilDate, DayKey } from './civil-day';

export type CalendarHeatmapResult = {
	data: HeatmapColumn[];
	rowLabels: string[];
};

export type CalendarHeatmapOptions = {
	weekStartsOn?: 0 | 1;
	/**
	 * Mark the days completing the first and last week outside the series' span as
	 * hidden cells rather than blank ones, giving the calendar ragged edges. Days
	 * inside the span stay blank even where the series has no entry.
	 */
	hideOutOfRangeDays?: boolean;
	/**
	 * Draw the grid over this span (`yyyy-MM-dd` bounds) instead of the series' own.
	 * Days inside the grid but outside the series become placeholder cells: painted,
	 * but reporting nothing, since they were never measured. A start bound opens from
	 * the beginning of its week, and bounds narrower than the series are ignored.
	 */
	gridSpan?: { start?: string; end?: string };
	/** BCP-47 tag the labels are written in. Defaults to the runtime's locale. */
	locale?: string;
	/**
	 * IANA zone the series' instants are bucketed into days in. Defaults to the
	 * runtime's zone. A `dateString` carrying no offset is taken as written.
	 */
	timeZone?: string;
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
 * @return The day key to draw to.
 */
const widenTo = (
	bound: string | undefined,
	fallback: DayKey,
	direction: 'earlier' | 'later'
): DayKey => {
	const key = bound ? writtenDayKey( bound ) : null;
	if ( ! key ) {
		if ( bound ) {
			warnOnce(
				`heatmap:gridSpan:${ bound }`,
				`gridSpan.${ direction === 'earlier' ? 'start' : 'end' } ${ JSON.stringify(
					bound
				) } is not a \`yyyy-MM-dd\` day, so the grid is drawn over the series' own span.`
			);
		}
		return fallback;
	}

	if ( direction === 'earlier' ) {
		return key < fallback ? key : fallback;
	}

	return key > fallback ? key : fallback;
};

/**
 * Lay a day-bucketed series out as calendar columns.
 *
 * @param series  - Points to bucket.
 * @param options - Grid shape, plus the locale and zone to read days in.
 * @return Columns and row labels for `HeatmapChart`.
 */
export const buildCalendarHeatmapData = (
	series: DataPointDate[],
	options: CalendarHeatmapOptions = {}
): CalendarHeatmapResult => {
	const weekStartsOn = options.weekStartsOn ?? 1;
	const hideOutOfRangeDays = options.hideOutOfRangeDays ?? true;

	// The provider sanitizes what it holds, but this function is called outside it too.
	const { locale, timeZone } = sanitizeFormatting( {
		locale: options.locale,
		timeZone: options.timeZone,
	} );

	const readInstant = instantDayReader( timeZone );

	const valueByDay = new Map< DayKey, number | null >();
	let minDayKey: DayKey | undefined;
	let maxDayKey: DayKey | undefined;
	for ( const point of series ) {
		const key = pointDayKey( point, readInstant );
		if ( ! key ) {
			const offending = point.dateString ?? ( point.date && String( point.date ) );
			warnOnce(
				`heatmap:unreadableDate:${ offending }`,
				offending
					? `${ JSON.stringify(
							offending
					  ) } is not a day this can read, so its point is left out of the calendar. A \`dateString\` must start \`yyyy-MM-dd\`.`
					: 'A point carries neither `date` nor `dateString`, so it is left out of the calendar.'
			);
			continue;
		}

		valueByDay.set( key, point.value );
		// Day keys are fixed-width, so lexicographic order is chronological order.
		if ( ! minDayKey || key < minDayKey ) {
			minDayKey = key;
		}
		if ( ! maxDayKey || key > maxDayKey ) {
			maxDayKey = key;
		}
	}

	if ( ! minDayKey || ! maxDayKey ) {
		return { data: [], rowLabels: [] };
	}

	const requestedMinDayKey = widenTo( options.gridSpan?.start, minDayKey, 'earlier' );
	const gridMaxDayKey = widenTo( options.gridSpan?.end, maxDayKey, 'later' );

	// Both are `DayKey`s, so they already round-tripped through `civilDate` once, and it
	// is a pure function of the string: re-parsing them here cannot fail.
	const requestedMinDate = civilDate( requestedMinDayKey ) as CivilDate;
	const gridMaxDate = civilDate( gridMaxDayKey ) as CivilDate;

	// The grid walks UTC proxies, so the label formatters read UTC. The host's zone
	// was already spent on bucketing.
	const labelFormatting = { locale, timeZone: 'UTC' };
	const formatWeekday = createDateFormatter( { weekday: 'short' }, labelFormatting );
	const formatMonth = createDateFormatter( { month: 'short' }, labelFormatting );
	const formatDay = createDateFormatter(
		{ weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' },
		labelFormatting
	);

	const gridStart = startOfCivilWeek( requestedMinDate, weekStartsOn );

	// `gridStart` rounds a start bound down to its week; those days are filler like the
	// rest of the widened span, not a ragged edge that would notch the first column.
	const gridMinDayKey = requestedMinDayKey < minDayKey ? civilKey( gridStart ) : requestedMinDayKey;
	const weekCount = civilWeekSpan( gridStart, gridMaxDate, weekStartsOn );

	const rowLabels = Array.from( { length: 7 }, ( _, row ) =>
		LABELLED_ROWS.includes( row ) ? formatWeekday( addCivilDays( gridStart, row ) ) : ''
	);

	// Hide short partial first-month labels when a later month follows; compact
	// cells make adjacent labels collide. Keep the label for single-month ranges.
	const MIN_FIRST_MONTH_WEEKS = 2;
	const firstMonth = gridStart.getUTCMonth();
	let firstMonthWeeks = 0;
	while (
		firstMonthWeeks < weekCount &&
		addCivilDays( gridStart, firstMonthWeeks * 7 ).getUTCMonth() === firstMonth
	) {
		firstMonthWeeks++;
	}
	const spansLaterMonth = firstMonthWeeks < weekCount;
	const showFirstMonthLabel = ! spansLaterMonth || firstMonthWeeks >= MIN_FIRST_MONTH_WEEKS;

	const data: HeatmapColumn[] = [];
	let previousMonth = -1;
	for ( let week = 0; week < weekCount; week++ ) {
		const columnStart = addCivilDays( gridStart, week * 7 );
		const month = columnStart.getUTCMonth();
		const isNewMonth = month !== previousMonth;
		const label =
			isNewMonth && ( week !== 0 || showFirstMonthLabel ) ? formatMonth( columnStart ) : '';
		previousMonth = month;

		const cells: HeatmapCell[] = [];
		for ( let row = 0; row < 7; row++ ) {
			const day = addCivilDays( gridStart, week * 7 + row );
			const key = civilKey( day );
			const cell: HeatmapCell = {
				label: formatDay( day ),
				value: valueByDay.has( key ) ? ( valueByDay.get( key ) as number | null ) : null,
			};
			if ( key < gridMinDayKey || key > gridMaxDayKey ) {
				// The days completing the grid's first and last week: the ragged edge.
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
