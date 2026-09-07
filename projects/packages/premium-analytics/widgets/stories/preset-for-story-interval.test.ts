/**
 * External dependencies
 */
import {
	getDefaultQueryParams,
	normalizeReportParams,
	STATS_CHART_BUCKET_PERIODS,
} from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { presetForStoryInterval } from './preset-for-story-interval';
import type { StatsChartBucketPeriod } from '@jetpack-premium-analytics/data';

/**
 * Resolve a story's bucket the way `WidgetRoot` does before the widget sees it.
 *
 * @param interval - The bucket the story control selected.
 * @return The bucket the widget is actually handed.
 */
function resolve( interval: StatsChartBucketPeriod ) {
	return normalizeReportParams(
		{ ...getDefaultQueryParams( false, presetForStoryInterval( interval ) ), interval },
		undefined
	).interval;
}

describe( 'presetForStoryInterval', () => {
	it.each( STATS_CHART_BUCKET_PERIODS )( 'survives normalization for %s', interval => {
		// Without a matching preset the control is inert: the default 30-day
		// range allows only `day` and `week`, so `month` redraws as `day`.
		expect( resolve( interval ) ).toBe( interval );
	} );
} );
