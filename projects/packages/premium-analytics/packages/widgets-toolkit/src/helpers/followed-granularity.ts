/**
 * External dependencies
 */
import { defaultPeriodForInterval } from './default-period-for-interval';
import type { StatsPeriod } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */

/**
 * The attribute a reader's bucket pick is stored under, and its companion
 * recording the page bucket that pick was made against.
 */
export const GRANULARITY_ATTRIBUTE = 'granularity';
export const GRANULARITY_PICKED_FOR_ATTRIBUTE = 'granularityPickedFor';

/**
 * The bucket a chart that follows the page should draw.
 *
 * A pick applies only while the page still resolves to the bucket it was made
 * against, so the page takes the bucket back the moment its interval moves —
 * without anyone having to notice the move and write the attribute back. That
 * matters because two places resolve this: the chart body and the header
 * control. Deciding from the stored values and the page alone, rather than from
 * what has happened since mount, is what keeps them from disagreeing.
 *
 * @param options           - The stored pick and the page's interval.
 * @param options.picked    - The bucket a reader picked, if any.
 * @param options.pickedFor - The page bucket that pick was made against.
 * @param options.interval  - The page's interval now.
 * @param options.allowed   - The buckets on offer, ordered finest to coarsest.
 * @return The bucket to draw.
 */
export function followedGranularity< P extends StatsPeriod >( {
	picked,
	pickedFor,
	interval,
	allowed,
}: {
	picked?: string;
	pickedFor?: string;
	interval?: string;
	allowed: readonly [ P, ...P[] ];
} ): P {
	const pagePeriod = defaultPeriodForInterval( interval, allowed );
	const applies =
		picked !== undefined &&
		pickedFor === pagePeriod &&
		( allowed as readonly string[] ).includes( picked );

	return applies ? ( picked as P ) : pagePeriod;
}
