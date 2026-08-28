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
 * Chart granularity for a dashboard interval, clamped into what a widget supports.
 * `allowed` is ordered finest to coarsest: a period finer than everything offered
 * resolves to the finest, and one coarser resolves to the coarsest.
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
