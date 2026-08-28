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
import type { WordAdsPeriod } from './use-wordads-chart';

/**
 * WordAds is reported to us a day at a time: a sub-daily window collapses to one
 * day-bucket, drawing no line and labelling yesterday's totals as the last 24
 * hours.
 */
export const WORDADS_GRAIN = {
	presetIds: [ PRESET_LAST_7_DAYS, PRESET_LAST_30_DAYS, PRESET_LAST_12_MONTHS ],
	periods: [ 'day', 'week', 'month', 'year' ],
} as const satisfies ReportGrain & { periods: readonly WordAdsPeriod[] };
