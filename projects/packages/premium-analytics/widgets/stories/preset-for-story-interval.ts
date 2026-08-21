/**
 * External dependencies
 */
import { PRESET_LAST_30_DAYS, PRESET_LAST_90_DAYS } from '@jetpack-premium-analytics/datetime';
import type { StatsChartBucketPeriod, PresetType } from '@jetpack-premium-analytics/data';

/**
 * The date preset a story needs to actually draw its chosen chart bucket.
 *
 * `WidgetRoot` normalizes injected report params through
 * `resolveIntervalForRange`, which coerces a bucket the range does not allow
 * back to the finest one it does. A story pinned to the default 30-day preset
 * therefore redraws a `month` pick as `day`, leaving the control inert. Moving
 * the range with the bucket keeps every option live, and mirrors the product,
 * where the interval control only offers what the range can fill.
 *
 * @param interval - The bucket the story control selected.
 * @return A preset whose range allows that bucket.
 */
export function presetForStoryInterval( interval: StatsChartBucketPeriod ): PresetType {
	// 30 days allows `day` and `week`; 90 days is the shortest preset allowing `month`.
	return interval === 'month' ? PRESET_LAST_90_DAYS : PRESET_LAST_30_DAYS;
}
