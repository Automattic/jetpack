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
 * Configurable attributes for the Video performance widget. The video scope
 * and report params reach it through WidgetRoot: the detail page seeds
 * `post_id` into the URL, and the dashboard date picker owns the range.
 *
 * @property chartType - How to draw the selected metric. Defaults to `line`.
 */
export type VideoDetailViewsPerformanceAttributes = {
	chartType?: VideoDetailViewsPerformanceChartType;
};

/**
 * Widget type definition.
 *
 * The video detail page's performance card: the scoped video's views,
 * impressions, hours watched, and retention rate over the dashboard date
 * range as selectable metric tabs, each headlined by the window's canonical
 * total. The series come from the `stats/video/{id}` `statType=all` daily
 * history, bucketed client-side at the page's chart interval; the `chartType`
 * attribute (`relevance: 'high'`) is rendered by the widget host.
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
