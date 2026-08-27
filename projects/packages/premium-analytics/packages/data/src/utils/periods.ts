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
 * into the set it does support. `allowed` is ordered finest to coarsest, so a
 * period finer than everything offered resolves to the finest and one coarser
 * to the coarsest — an hourly page interval lands on `day` for a day/week/month
 * widget, and a yearly one lands on `month`.
 *
 * @param interval - The dashboard-derived interval.
 * @param allowed  - The periods this widget offers, ordered finest to coarsest.
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

	const finest = allowed[ 0 ];

	return PERIOD_ORDER.indexOf( mapped ) < PERIOD_ORDER.indexOf( finest )
		? finest
		: allowed[ allowed.length - 1 ];
}

/**
 * The buckets an interval menu may list for a chart that draws only `allowed`.
 *
 * `intervals` is what the range permits. One the clamp above would move is a
 * bucket the chart cannot draw, so listing it makes the click a no-op: the
 * check mark travels and nothing else does.
 *
 * When the clamp moves every one of them — a window finer than the chart's
 * finest bucket, e.g. three days on a report served a day at a time — the menu
 * falls back to where the clamp lands, so a range still offers a bucket that
 * works rather than an empty menu.
 *
 * @param intervals - The buckets the range allows, finest first.
 * @param allowed   - The periods this widget offers, ordered finest to coarsest.
 * @return The buckets to list, in the order given.
 */
export function drawableIntervals< P extends StatsPeriod >(
	intervals: readonly IntervalType[],
	allowed: readonly [ P, ...P[] ]
): IntervalType[] {
	const drawable = intervals.filter( interval =>
		( allowed as readonly StatsPeriod[] ).includes( getStatsPeriodFromInterval( interval ) )
	);

	return drawable.length
		? drawable
		: [ ...new Set( intervals.map( interval => defaultPeriodForInterval( interval, allowed ) ) ) ];
}
