/**
 * External dependencies
 */
import { reportingTimeZone, toLocalTZ } from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */
import { resolvePrimarySeriesByGroup } from '../../../helpers/resolve-series-names';
import type { ComparativeDatePointDate, ComparativeLineChartSeries } from '../types';
import type { TZDate } from '@jetpack-premium-analytics/datetime';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// Read in the zone a bucket was stamped in, which a `TZDate` carries, so two days' hours
// compare as numbers whatever their offsets.
function clockTime( date: Date ): number {
	const wall = toLocalTZ(
		date.getTime(),
		( date as Partial< TZDate > ).timeZone ?? reportingTimeZone()
	);

	return Date.UTC(
		wall.getFullYear(),
		wall.getMonth(),
		wall.getDate(),
		wall.getHours(),
		wall.getMinutes()
	);
}

function isSubDaily( points: ComparativeDatePointDate[] ): boolean {
	return (
		points.length > 1 && clockTime( points[ 1 ].date ) - clockTime( points[ 0 ].date ) < DAY_MS / 2
	);
}

// A daylight saving day has 23 or 25 hours, so position stops naming the same hour.
function alignByClockTime(
	primary: ComparativeDatePointDate[],
	comparison: ComparativeDatePointDate[]
): ComparativeDatePointDate[] {
	const comparisonByClock = new Map(
		comparison.map( point => [ clockTime( point.date ), point ] )
	);
	const firstShift = clockTime( primary[ 0 ].date ) - clockTime( comparison[ 0 ].date );
	const days = Math.round( firstShift / DAY_MS ) * DAY_MS;
	// A window shifted back in real hours starts an hour off the clock when a switch falls between.
	const shift = days !== 0 && Math.abs( firstShift - days ) <= HOUR_MS ? days : firstShift;

	// One point per current hour, as keyboard navigation reads every series at the same index.
	return primary.map( slot => {
		const point = comparisonByClock.get( clockTime( slot.date ) - shift );

		return point
			? { ...point, date: slot.date, realDate: point.date }
			: { date: slot.date, value: null };
	} );
}

/**
 * Aligns comparison points onto the primary series, keeping their real dates in
 * `realDate` for tooltips: sub-daily points by clock time, coarser ones by position. A grouped
 * comparison aligns to its group's current period, an ungrouped one to series[0], and one
 * marked `aligned` stays where its producer put it.
 */
export function alignSeriesDates(
	series: ComparativeLineChartSeries[]
): ComparativeLineChartSeries[] {
	if ( series.length < 2 ) {
		return series;
	}

	const fallbackPrimary = series[ 0 ];

	// Preserve the historical no-data contract, including the original array
	// reference, when the chart's axis-setting series has no points.
	if ( ! fallbackPrimary.data.length ) {
		return series;
	}

	const primarySeriesByGroup = resolvePrimarySeriesByGroup( series );

	return series.map( comparisonSeries => {
		if (
			! comparisonSeries.data.length ||
			comparisonSeries.options?.type !== 'comparison' ||
			comparisonSeries.aligned
		) {
			return comparisonSeries;
		}

		const primary =
			( comparisonSeries.group !== undefined
				? primarySeriesByGroup.get( comparisonSeries.group )
				: undefined ) ?? fallbackPrimary;

		if ( ! primary.data.length ) {
			return comparisonSeries;
		}

		const primaryFirstDate = primary.data[ 0 ]?.date;
		const comparisonFirstDate = comparisonSeries.data[ 0 ]?.date;

		const primaryFirstMs =
			primaryFirstDate instanceof Date ? primaryFirstDate.getTime() : primaryFirstDate;

		const comparisonFirstMs =
			comparisonFirstDate instanceof Date ? comparisonFirstDate.getTime() : comparisonFirstDate;

		if ( primaryFirstMs === comparisonFirstMs ) {
			return comparisonSeries;
		}

		if ( isSubDaily( primary.data ) ) {
			return {
				...comparisonSeries,
				data: alignByClockTime( primary.data, comparisonSeries.data ),
			};
		}

		return {
			...comparisonSeries,
			data: comparisonSeries.data.map( ( point, index ) => {
				// A longer comparison series falls back to the last primary date.
				const primaryDate =
					primary.data[ index ]?.date ?? primary.data[ primary.data.length - 1 ]?.date;

				return {
					...point,
					date: primaryDate,
					realDate: point.date,
				};
			} ),
		};
	} );
}
