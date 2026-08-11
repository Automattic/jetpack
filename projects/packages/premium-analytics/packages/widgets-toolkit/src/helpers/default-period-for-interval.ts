/**
 * Bucket sizes ordered finest to coarsest, so a mapped period the widget does
 * not offer can be clamped in the right direction.
 */
const PERIOD_ORDER = [ 'hour', 'day', 'week', 'month', 'year' ] as const;

/**
 * Dashboard interval to chart bucket size. Quarters have no Stats bucket of
 * their own and collapse onto months; anything unmapped falls back to `day`.
 */
const PERIOD_FOR_INTERVAL: Record< string, string > = {
	hour: 'hour',
	week: 'week',
	month: 'month',
	quarter: 'month',
	year: 'year',
};

/**
 * Chart granularity for a dashboard interval: the bucket size a widget draws
 * for whatever the page's interval control has selected.
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
export function defaultPeriodForInterval< P extends string >(
	interval: string | undefined,
	allowed: readonly [ P, ...P[] ]
): P {
	const mapped = PERIOD_FOR_INTERVAL[ interval ?? '' ] ?? 'day';

	if ( allowed.includes( mapped as P ) ) {
		return mapped as P;
	}

	const finest = allowed[ 0 ];

	return PERIOD_ORDER.indexOf( mapped as ( typeof PERIOD_ORDER )[ number ] ) <
		PERIOD_ORDER.indexOf( finest as ( typeof PERIOD_ORDER )[ number ] )
		? finest
		: allowed[ allowed.length - 1 ];
}
