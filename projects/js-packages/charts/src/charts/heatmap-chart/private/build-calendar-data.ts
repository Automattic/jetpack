import { addDays, differenceInCalendarWeeks, format, parseISO, startOfWeek } from 'date-fns';
import type { DataPointDate } from '../../../types';
import type { HeatmapCell, HeatmapColumn } from '../types';

export type CalendarHeatmapResult = {
	data: HeatmapColumn[];
	rowLabels: string[];
};

export type CalendarHeatmapOptions = {
	weekStartsOn?: 0 | 1;
	startDate?: Date | string;
	endDate?: Date | string;
};

/** Rows that get a weekday label (Mon, Wed, Fri with a Monday week start). */
const LABELLED_ROWS = [ 0, 2, 4 ];

const toDateValue = ( value?: Date | string ): Date | null => {
	if ( value instanceof Date && ! isNaN( value.getTime() ) ) {
		return value;
	}
	if ( typeof value === 'string' ) {
		const parsed = parseISO( value );
		if ( ! isNaN( parsed.getTime() ) ) {
			return parsed;
		}
	}
	return null;
};

const toDate = ( point: DataPointDate ): Date | null => {
	return toDateValue( point.date ) ?? toDateValue( point.dateString );
};

export const buildCalendarHeatmapData = (
	series: DataPointDate[],
	options: CalendarHeatmapOptions = {}
): CalendarHeatmapResult => {
	const weekStartsOn = options.weekStartsOn ?? 1;

	const entries = series
		.map( point => ( { date: toDate( point ), value: point.value } ) )
		.filter( ( entry ): entry is { date: Date; value: number | null } => entry.date !== null );

	if ( ! entries.length ) {
		return { data: [], rowLabels: [] };
	}

	const valueByDay = new Map< string, number | null >();
	const startDate = toDateValue( options.startDate );
	const endDate = toDateValue( options.endDate );
	let minDate = startDate ?? entries[ 0 ].date;
	let maxDate = endDate ?? entries[ 0 ].date;
	for ( const { date, value } of entries ) {
		valueByDay.set( format( date, 'yyyy-MM-dd' ), value );
		if ( ! startDate && date < minDate ) {
			minDate = date;
		}
		if ( ! endDate && date > maxDate ) {
			maxDate = date;
		}
	}

	if ( minDate > maxDate ) {
		return { data: [], rowLabels: [] };
	}

	const gridStart = startOfWeek( minDate, { weekStartsOn } );
	const weekCount = differenceInCalendarWeeks( maxDate, gridStart, { weekStartsOn } ) + 1;

	const rowLabels = Array.from( { length: 7 }, ( _, row ) =>
		LABELLED_ROWS.includes( row ) ? format( addDays( gridStart, row ), 'EEE' ) : ''
	);

	const data: HeatmapColumn[] = [];
	let previousMonth = -1;
	for ( let week = 0; week < weekCount; week++ ) {
		const columnStart = addDays( gridStart, week * 7 );
		const month = columnStart.getMonth();
		const label = month !== previousMonth ? format( columnStart, 'MMM' ) : '';
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
