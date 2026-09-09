import { dateI18n, getDate } from '@wordpress/date';
import type { PerformanceHistoryPeriod } from './use-performance-history';

export type HistoryWindow = { startDate: number; endDate: number };
export type HistoryDay = { date: string; period?: PerformanceHistoryPeriod };

function addDays( date: string, days: number ): string {
	const calendarDate = new Date( `${ date }T00:00:00Z` );
	calendarDate.setUTCDate( calendarDate.getUTCDate() + days );
	return calendarDate.toISOString().slice( 0, 10 );
}

export function getHistoryWindow( offset: number, now = new Date() ): HistoryWindow {
	const today = dateI18n( 'Y-m-d', now, false );
	const lastDay = addDays( today, -30 * Math.max( 0, Math.trunc( offset ) ) );
	return {
		startDate: getDate( `${ addDays( lastDay, -29 ) }T00:00:00` ).getTime(),
		endDate: getDate( `${ addDays( lastDay, 1 ) }T00:00:00` ).getTime() - 1,
	};
}

export function bucketHistoryDays(
	periods: PerformanceHistoryPeriod[],
	window: HistoryWindow
): HistoryDay[] {
	const byDay = new Map< string, PerformanceHistoryPeriod >();
	for ( const period of periods ) {
		if ( period.timestamp < window.startDate || period.timestamp > window.endDate ) {
			continue;
		}
		const day = dateI18n( 'Y-m-d', period.timestamp, false );
		const previous = byDay.get( day );
		if ( ! previous || previous.timestamp < period.timestamp ) {
			byDay.set( day, period );
		}
	}
	const firstDay = dateI18n( 'Y-m-d', window.startDate, false );
	return Array.from( { length: 30 }, ( _, index ) => {
		const date = addDays( firstDay, index );
		return { date, period: byDay.get( date ) };
	} );
}
