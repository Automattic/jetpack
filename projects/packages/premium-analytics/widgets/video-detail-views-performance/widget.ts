/**
 * Internal dependencies
 */
import type { ChartDisplayChartType } from '@jetpack-premium-analytics/widgets-toolkit';

/**
 * How the selected metric is drawn. The alias ties the attribute to the
 * toolkit's own union, which the chart reads.
 */
export type VideoDetailViewsPerformanceChartType = ChartDisplayChartType;

/**
 * `post_id` (video scope) and report params reach the widget via WidgetRoot.
 *
 * @property chartType - How to draw the selected metric. Defaults to `bar`.
 */
export type VideoDetailViewsPerformanceAttributes = {
	chartType?: VideoDetailViewsPerformanceChartType;
};

/**
 * Series come from the `stats/video/{id}` `statType=all` daily history,
 * bucketed client-side at the page's chart interval.
 */
export default {
	example: {
		attributes: {
			chartType: 'bar',
		},
	},
};
