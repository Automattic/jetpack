/**
 * Default chart granularity for a dashboard interval: opens a granularity
 * control at the setting the range implies, and — until the user picks one
 * explicitly — keeps following the range.
 *
 * A widget's dropdown rarely offers every granularity, so the mapped period is
 * clamped to the coarsest one the widget does offer. That is why a quarter or
 * year range lands on `month` for a day/week/month widget but keeps `year` for
 * one that offers it.
 *
 * @param interval - The dashboard-derived interval.
 * @param allowed  - The periods this widget offers, ordered finest to coarsest.
 * @return The matching selectable granularity.
 */
export function defaultPeriodForInterval< P extends string >(
	interval: string | undefined,
	allowed: readonly P[]
): P {
	const mapped =
		{
			week: 'week',
			month: 'month',
			quarter: 'month',
			year: 'year',
		}[ interval ?? '' ] ?? 'day';

	const supported = allowed.includes( mapped as P );

	return supported ? ( mapped as P ) : allowed[ allowed.length - 1 ];
}
