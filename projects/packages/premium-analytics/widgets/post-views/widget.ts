/**
 * Internal dependencies
 */
import type { ChartDisplayChartType } from '@jetpack-premium-analytics/widgets-toolkit';

/**
 * How the views series is drawn. The alias ties the attribute to the
 * toolkit's own union, which the chart reads.
 */
export type PostViewsChartType = ChartDisplayChartType;

/**
 * Configurable attributes for the Post views widget. The post scope reaches it
 * through WidgetRoot: the detail page seeds `post_id` into the URL.
 */
export type PostViewsAttributes = {
	chartType?: PostViewsChartType;
};

/**
 * Ported from the legacy Calypso post summary chart (`stats-post-summary`). The
 * series comes from the `stats/post/{id}` daily history, bucketed client-side at
 * the page's chart interval.
 */
export default {
	example: {
		attributes: {
			chartType: 'bar',
		},
	},
};
