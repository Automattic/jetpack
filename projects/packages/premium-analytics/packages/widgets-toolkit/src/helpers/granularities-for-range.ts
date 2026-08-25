/**
 * External dependencies
 */
import {
	getAllowedIntervalsForPreset,
	type ReportParams,
	type StatsPeriod,
} from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { defaultPeriodForInterval } from './default-period-for-interval';

/**
 * The buckets a chart offers for the page's range: the ones it can draw,
 * narrowed to the ones the range can fill.
 *
 * The two constraints are independent — what a chart is able to draw is fixed,
 * what a range has to draw with is not — so a chart that offered its whole set
 * would list buckets the range would only coerce away, and a reader picking one
 * would get a different bucket than the one they clicked.
 *
 * Also the set a pick is judged against, so a pick that a range change leaves
 * unfillable lapses back to the page's bucket instead of quietly outliving the
 * range it was made for.
 *
 * @param declared - The buckets the chart can draw, ordered finest to coarsest.
 * @param params   - The page's normalized report params.
 * @return The buckets to offer, in the chart's own order, never empty.
 */
export function granularitiesForRange< P extends StatsPeriod >(
	declared: readonly [ P, ...P[] ],
	params: Pick< ReportParams, 'preset' | 'from' | 'to' | 'interval' >
): readonly [ P, ...P[] ] {
	const forRange = getAllowedIntervalsForPreset(
		params.preset,
		params.from ?? '',
		params.to ?? ''
	) as readonly string[];
	const offered = declared.filter( period => forRange.includes( period ) );

	// A range whose buckets are all coarser than anything the chart draws — a
	// multi-year window against a chart that stops at months — leaves nothing in
	// common. The chart still draws its clamped bucket, so name that one rather
	// than offer an empty control.
	return offered.length > 0
		? ( offered as [ P, ...P[] ] )
		: [ defaultPeriodForInterval( params.interval, declared ) ];
}
