/**
 * Internal dependencies
 */
import {
	getAllowedIntervalsForPreset,
	getLockedIntervalsForPreset,
	NO_LOCKED_INTERVALS,
	type LockableInterval,
} from './interval';
import { getStatsPeriodFromInterval, type StatsPeriod } from './stats-params';
import type { ReportParams } from './search';
import type { IntervalType, PrimaryPresetId } from '@jetpack-premium-analytics/datetime';

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
 * That fallback clamps both ways, so it assumes no widget offers only buckets
 * finer than the range allows: an hours-only chart on a month-long range would
 * list `hour`. Returning empty instead would make `chartInterval` partial.
 *
 * @param intervals - The buckets the range allows, default first.
 * @param allowed   - The periods this widget offers, in any order.
 * @return The buckets to list, in the order given.
 */
export function drawableIntervals< P extends StatsPeriod >(
	intervals: readonly IntervalType[],
	allowed: readonly [ P, ...P[] ]
): P[] {
	// Membership, not the mapped period: mapping onto a period the chart offers
	// is not the same as the chart drawing that bucket.
	const drawable = intervals.filter( ( interval ): interval is P =>
		( allowed as readonly string[] ).includes( interval )
	);

	return drawable.length
		? drawable
		: [ ...new Set( intervals.map( interval => defaultPeriodForInterval( interval, allowed ) ) ) ];
}

/** A range as the interval helpers read it. */
export type IntervalRange = { preset?: PrimaryPresetId; from?: string; to?: string };

/** A bucket a widget may add or withhold: one no plan locks, so a widget cannot reopen a lock. */
type ExtensionInterval = Exclude< IntervalType, LockableInterval >;

/**
 * What one widget changes about the buckets its range allows: ones it adds after the range's
 * own, and ones it lists but cannot draw right now, with the reason.
 */
export type IntervalExtension = {
	extra?: readonly ExtensionInterval[];
	unavailable?: { intervals: readonly ExtensionInterval[]; hint: string };
};

function extendedIntervals(
	range: IntervalRange,
	locked: readonly LockableInterval[],
	extension?: IntervalExtension
): { allowed: IntervalType[]; withheld: IntervalType[] } {
	const own = getAllowedIntervalsForPreset(
		range.preset,
		range.from ?? '',
		range.to ?? '',
		locked
	);
	const allowed = [
		...own,
		...( extension?.extra ?? [] ).filter( interval => ! own.includes( interval ) ),
	];
	// An open bucket stays open, so the menu and the chart agree on it.
	const withheld = ( extension?.unavailable?.intervals ?? [] ).filter(
		interval => ! allowed.includes( interval )
	);

	return { allowed, withheld };
}

/**
 * The bucket a widget's chart draws for a set of report params.
 *
 * The control checks the item this returns and the chart draws it, both from
 * the same params, so a menu can never check a bucket the chart is not drawing.
 *
 * @param params    - The report params the chart reads.
 * @param periods   - The periods this widget offers, in any order.
 * @param locked    - The buckets the plan locks; optional because SDK widgets cannot read the plan.
 * @param extension - The widget's own changes to what the range allows.
 * @return The bucket the chart draws.
 */
export function chartInterval< P extends StatsPeriod >(
	params: Pick< ReportParams, 'preset' | 'from' | 'to' | 'interval' >,
	periods: readonly [ P, ...P[] ],
	locked: readonly LockableInterval[] = NO_LOCKED_INTERVALS,
	extension?: IntervalExtension
): P {
	const { allowed, withheld } = extendedIntervals( params, locked, extension );
	// A withheld bucket lands on the default, not the nearest: on a year-long range
	// the nearest to days is weeks, while the default is months.
	const isWithheld = !! params.interval && withheld.includes( params.interval );
	// Both inputs are total, so the list is never empty.
	const [ first, ...rest ] = drawableIntervals( allowed, periods );

	// No stored bucket means the range default, which leads the list without
	// being its finest: a year-long range defaults to months over weeks.
	return defaultPeriodForInterval( isWithheld ? first : ( params.interval ?? first ), [
		first,
		...rest,
	] );
}

/**
 * What an interval menu lists: the buckets it can pick, then the ones the widget withholds,
 * then the ones the plan locks.
 *
 * One call, so a bucket the chart falls back to is never also listed locked.
 *
 * @param params    - The range the menu reads.
 * @param locked    - The buckets the plan locks.
 * @param periods   - The periods the chart draws; every bucket when the widget declares none.
 * @param extension - The widget's own changes to what the range allows.
 * @return The open, withheld and locked buckets in the range's order, a widget's extras last, and the hint.
 */
export function intervalMenuOptions(
	params: IntervalRange,
	locked: readonly LockableInterval[],
	periods?: readonly [ StatsPeriod, ...StatsPeriod[] ],
	extension?: IntervalExtension
): {
	options: IntervalType[];
	lockedOptions: LockableInterval[];
	unavailableOptions: IntervalType[];
	unavailableHint?: string;
} {
	const from = params.from ?? '';
	const to = params.to ?? '';
	const { allowed, withheld } = extendedIntervals( params, locked, extension );
	const options: IntervalType[] = periods ? drawableIntervals( allowed, periods ) : allowed;
	const lockedOptions = getLockedIntervalsForPreset( params.preset, from, to, locked ).filter(
		interval => ( ! periods || periods.includes( interval ) ) && ! options.includes( interval )
	);
	const hint = withheld.length ? extension?.unavailable?.hint : undefined;

	return {
		options,
		lockedOptions,
		unavailableOptions: withheld,
		...( hint && { unavailableHint: hint } ),
	};
}
