/**
 * External dependencies
 */
import { getStatsPeriodFromInterval, type StatsPeriod } from '@jetpack-premium-analytics/data';

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
