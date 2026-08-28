/**
 * Internal dependencies
 */
import { getStatsPeriodFromInterval, type StatsPeriod } from './stats-params';
import type { IntervalType } from '@jetpack-premium-analytics/datetime';

/**
 * Bucket sizes ordered finest to coarsest, so a mapped period the widget does
 * not offer can be clamped in the right direction.
 */
const PERIOD_ORDER = [
	'hour',
	'day',
	'week',
	'month',
	'year',
] as const satisfies readonly StatsPeriod[];

/**
 * Chart granularity for a dashboard interval: the bucket size a widget draws
 * for whatever the page's interval control has selected. The interval maps to a
 * bucket the same way a Stats request does, so a chart is bucketed as the data
 * behind it is.
 *
 * A widget rarely supports every granularity, so the mapped period is clamped
 * into the set it does support: one finer than everything offered lands on the
 * finest offered, one coarser on the coarsest. An hourly page interval lands on
 * `day` for a day/week/month widget, and a yearly one lands on `month`.
 *
 * @param interval - The dashboard-derived interval.
 * @param allowed  - The periods this widget offers, in any order.
 * @return The matching granularity.
 */
export function defaultPeriodForInterval< P extends StatsPeriod >(
	interval: string | undefined,
	allowed: readonly [ P, ...P[] ]
): P {
	const mapped = getStatsPeriodFromInterval( interval );

	if ( ( allowed as readonly StatsPeriod[] ).includes( mapped ) ) {
		return mapped as P;
	}

	// Rank against `PERIOD_ORDER` rather than trusting the caller's order, so a
	// widget's set is a set and cannot be written the wrong way round.
	const ranked = [ ...allowed ].sort(
		( a, b ) => PERIOD_ORDER.indexOf( a ) - PERIOD_ORDER.indexOf( b )
	);
	const finest = ranked[ 0 ];

	return PERIOD_ORDER.indexOf( mapped ) < PERIOD_ORDER.indexOf( finest )
		? finest
		: ranked[ ranked.length - 1 ];
}

/**
 * The buckets an interval menu may list for a chart that draws only `allowed`.
 *
 * Listing one the chart does not draw makes the click a no-op. When the range
 * allows nothing it draws — a day or less, which is offered as hours alone —
 * fall back to where the clamp lands rather than leaving the menu empty.
 *
 * @param intervals - The buckets the range allows, finest first.
 * @param allowed   - The periods this widget offers, in any order.
 * @return The buckets to list, in the order given.
 */
export function drawableIntervals< P extends StatsPeriod >(
	intervals: readonly IntervalType[],
	allowed: readonly [ P, ...P[] ]
): IntervalType[] {
	// Membership, not the mapped period: mapping onto a period the chart offers
	// is not the same as the chart drawing that bucket.
	const drawable = intervals.filter( interval =>
		( allowed as readonly string[] ).includes( interval )
	);

	return drawable.length
		? drawable
		: [ ...new Set( intervals.map( interval => defaultPeriodForInterval( interval, allowed ) ) ) ];
}
