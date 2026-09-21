/**
 * External dependencies
 */
import {
	PRESET_LAST_7_DAYS,
	PRESET_LAST_30_DAYS,
	PRESET_LAST_12_MONTHS,
} from '@jetpack-premium-analytics/datetime';
import type { ReportGrain } from '@jetpack-premium-analytics/fields';
/**
 * Internal dependencies
 */
import type { SubscribersPeriod } from './use-subscribers-chart';

/**
 * `stats/subscribers` has no sub-daily bucket, so a window shorter than a day
 * collapses to one point and would label a calendar day as the last 24 hours.
 */
export const SUBSCRIBERS_GRAIN = {
	presetIds: [ PRESET_LAST_7_DAYS, PRESET_LAST_30_DAYS, PRESET_LAST_12_MONTHS ],
	periods: [ 'day', 'week', 'month' ],
} as const satisfies ReportGrain & { periods: readonly SubscribersPeriod[] };
