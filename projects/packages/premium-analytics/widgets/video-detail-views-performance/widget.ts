/**
 * WordPress dependencies
 */
import { seen } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import {
	chartTypeAttributeField,
	type ChartDisplayChartType,
} from '@jetpack-premium-analytics/widgets-toolkit';

/**
 * How the selected metric is drawn. The shared chart-display list keeps every
 * chart widget's dropdown identical and ties it to the toolkit's own union.
 */
export type VideoDetailViewsPerformanceChartType = ChartDisplayChartType;

/**
 * `post_id` (video scope) and report params reach the widget via WidgetRoot.
 *
 * @property chartType - How to draw the selected metric. Defaults to `line`.
 */
export type VideoDetailViewsPerformanceAttributes = {
	chartType?: VideoDetailViewsPerformanceChartType;
};

/**
 * Series come from the `stats/video/{id}` `statType=all` daily history,
 * bucketed client-side at the page's chart interval.
 */
export default {
	icon: seen,
	attributes: [
		chartTypeAttributeField(),
	] as WidgetAttributeField< VideoDetailViewsPerformanceAttributes >[],
	example: {
		attributes: {
			chartType: 'line',
		},
	},
};
