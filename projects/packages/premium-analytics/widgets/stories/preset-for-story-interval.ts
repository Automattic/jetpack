/**
 * External dependencies
 */
import { PRESET_LAST_30_DAYS, PRESET_LAST_90_DAYS } from '@jetpack-premium-analytics/datetime';
import type { StatsChartBucketPeriod, PresetType } from '@jetpack-premium-analytics/data';

/**
 * `WidgetRoot` normalizes an injected report param through `resolveIntervalForRange`,
 * which redraws a bucket the range can't fill down to the finest one it can — so
 * the preset must move with the bucket to keep every story control option live.
 */
export function presetForStoryInterval( interval: StatsChartBucketPeriod ): PresetType {
	// 30 days allows `day` and `week`; 90 days is the shortest preset allowing `month`.
	return interval === 'month' ? PRESET_LAST_90_DAYS : PRESET_LAST_30_DAYS;
}
