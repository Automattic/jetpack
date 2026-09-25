/**
 * External dependencies
 */
import {
	PRESET_LAST_12_MONTHS,
	PRESET_LAST_30_DAYS,
	PRESET_LAST_7_DAYS,
	type ReportGrain,
} from '@automattic/jetpack-premium-analytics-api';
/**
 * Internal dependencies
 */
import type { WordAdsPeriod } from './use-wordads-chart';

/**
 * WordAds is reported to us a day at a time: a sub-daily window collapses to one
 * day-bucket, drawing no line and labelling yesterday's totals as the last 24
 * hours, and its trailing day stays empty until the nightly run lands.
 */
export const WORDADS_GRAIN = {
	presetIds: [ PRESET_LAST_7_DAYS, PRESET_LAST_30_DAYS, PRESET_LAST_12_MONTHS ],
	periods: [ 'day', 'week', 'month' ],
} as const satisfies ReportGrain & { periods: readonly WordAdsPeriod[] };
