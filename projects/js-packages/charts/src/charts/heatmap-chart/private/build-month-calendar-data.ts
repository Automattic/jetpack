import { createDateFormatter, sanitizeFormatting } from '../../../utils/date-formatting';
import { warnOnce } from '../../../utils/warn-once';
import { addCivilDays, civilDate, civilKey, startOfCivilWeek } from './civil-day';
import { isPresent } from './use-heatmap-colors';
import type { HeatmapCell, HeatmapColumn, HeatmapColumnGroup } from '../types';
import type { CivilDate, DayKey } from './civil-day';

export type MonthCalendarHeatmapRange = {
	/** First measured day, `yyyy-MM-dd`. */
	start: string;
	/** Last measured day, `yyyy-MM-dd`, inclusive. */
	end: string;
};

export type MonthCalendarHeatmapOptions = {
	/** 0 = Sunday, 1 = Monday. Default 1. */
	weekStartsOn?: 0 | 1;
	/** BCP-47 tag the month and day labels are written in. Defaults to the runtime's locale. */
	locale?: string;
};

export type MonthCalendarHeatmapResult = {
	data: HeatmapColumn[];
	columnGroups: HeatmapColumnGroup[];
};

/** Week rows per month, fixed so every month block is the same height. */
export const MONTH_ROWS = 6;

const DAYS_PER_WEEK = 7;

const startOfCivilMonth = ( date: CivilDate ): CivilDate => {
	const first = new Date( date.getTime() ) as CivilDate;
	first.setUTCDate( 1 );
	return first;
};

const startOfNextCivilMonth = ( date: CivilDate ): CivilDate => {
	const next = startOfCivilMonth( date );
	next.setUTCMonth( next.getUTCMonth() + 1 );
	return next;
};

/**
 * Lay a day-keyed map out as one month calendar per month, weekdays across and
 * weeks down, for `HeatmapChart` with `columnGroups`.
 *
 * @param valueByDay - Value per `yyyy-MM-dd`. A missing day is `null`.
 * @param range      - The measured days; every month either end falls in is drawn.
 * @param options    - Week start and label locale.
 * @return Columns and one group per month; empty when the range names no days.
 */
export const buildMonthCalendarHeatmapData = (
	valueByDay: Record< string, number | null >,
	range: MonthCalendarHeatmapRange,
	options: MonthCalendarHeatmapOptions = {}
): MonthCalendarHeatmapResult => {
	const start = civilDate( range.start );
	const end = civilDate( range.end );
	if ( ! start || ! end || start.getTime() > end.getTime() ) {
		warnOnce(
			`heatmap:monthRange:${ range.start }:${ range.end }`,
			`range ${ JSON.stringify(
				range
			) } must be two \`yyyy-MM-dd\` days with start on or before end, so the calendar is empty.`
		);
		return { data: [], columnGroups: [] };
	}
	const startKey = civilKey( start );
	const endKey = civilKey( end );
	const weekStartsOn = options.weekStartsOn ?? 1;
	const { locale } = sanitizeFormatting( { locale: options.locale } );

	for ( const key of Object.keys( valueByDay ) ) {
		if ( ! civilDate( key ) ) {
			warnOnce(
				`heatmap:monthKey:${ key }`,
				`${ JSON.stringify(
					key
				) } is not a \`yyyy-MM-dd\` day, so its value is left out of the calendar.`
			);
		}
	}
	const readValue = ( key: DayKey ): number | null => {
		const value = valueByDay[ key ];
		return isPresent( value ) ? value : null;
	};

	// Formatters read UTC proxies. `gregory` keeps a locale whose default calendar
	// is not Gregorian (fa-IR) from naming one grid month twice.
	const labelFormatting = { locale, timeZone: 'UTC' };
	const formatMonth = createDateFormatter(
		{ month: 'short', calendar: 'gregory' },
		labelFormatting
	);
	const formatDay = createDateFormatter(
		{ weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', calendar: 'gregory' },
		labelFormatting
	);

	const data: HeatmapColumn[] = [];
	const columnGroups: HeatmapColumnGroup[] = [];
	const lastMonthStart = startOfCivilMonth( end );

	for (
		let monthStart = startOfCivilMonth( start );
		monthStart.getTime() <= lastMonthStart.getTime();
		monthStart = startOfNextCivilMonth( monthStart )
	) {
		const monthStartKey = civilKey( monthStart );
		const monthEndKey = civilKey( addCivilDays( startOfNextCivilMonth( monthStart ), -1 ) );
		const gridStart = startOfCivilWeek( monthStart, weekStartsOn );

		for ( let weekday = 0; weekday < DAYS_PER_WEEK; weekday++ ) {
			const cells: HeatmapCell[] = [];
			for ( let week = 0; week < MONTH_ROWS; week++ ) {
				const day = addCivilDays( gridStart, week * DAYS_PER_WEEK + weekday );
				const key = civilKey( day );
				if ( key < monthStartKey || key > monthEndKey ) {
					cells.push( { value: null, hidden: true } );
				} else if ( key < startKey || key > endKey ) {
					cells.push( { label: formatDay( day ), value: null, placeholder: true } );
				} else {
					cells.push( { label: formatDay( day ), value: readValue( key ) } );
				}
			}
			data.push( { data: cells } );
		}
		columnGroups.push( { label: formatMonth( monthStart ), span: DAYS_PER_WEEK } );
	}

	return { data, columnGroups };
};
