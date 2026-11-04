/**
 * External dependencies
 */
import type { TickResolution } from '@jetpack-premium-analytics/externals';

/** A chart's bucket size: the charts library's tick resolutions, plus quarters. */
export type BucketResolution = TickResolution | 'quarter';

/**
 * The tick resolution the charts library draws a bucket size at.
 *
 * @param resolution - The chart's bucket size.
 * @return The library resolution; a quarter sits on its first month, as the library has no quarter ticks.
 */
export function toTickResolution( resolution?: BucketResolution ): TickResolution | undefined {
	return resolution === 'quarter' ? 'month' : resolution;
}
