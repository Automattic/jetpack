import { addDays, differenceInCalendarWeeks, format, parseISO, startOfWeek } from 'date-fns';
import type { DataPointDate } from '../../../types';
import type { HeatmapCell, HeatmapColumn } from '../types';

export type CalendarHeatmapResult = {
	data: HeatmapColumn[];
	rowLabels: string[];
};

/** Rows that get a weekday label (Mon, Wed, Fri with a Monday week start). */
const LABELLED_ROWS = [ 0, 2, 4 ];

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

export const buildCalendarHeatmapData = (
	series: DataPointDate[],
	options: { weekStartsOn?: 0 | 1 } = {}
): CalendarHeatmapResult => {
	const weekStartsOn = options.weekStartsOn ?? 1;

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

	const gridStart = startOfWeek( minDate, { weekStartsOn } );
	const weekCount = differenceInCalendarWeeks( maxDate, gridStart, { weekStartsOn } ) + 1;

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
			cells.push( {
				label: format( day, 'EEE, MMM d, yyyy' ),
				value: valueByDay.has( key ) ? ( valueByDay.get( key ) as number | null ) : null,
			} );
		}
		data.push( { label, data: cells } );
	}

	return { data, rowLabels };
};
