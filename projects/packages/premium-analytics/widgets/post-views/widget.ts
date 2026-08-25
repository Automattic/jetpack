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
 * How the views series is drawn. The shared chart-display list keeps every
 * chart widget's dropdown identical and ties it to the toolkit's own union.
 */
export type PostViewsChartType = ChartDisplayChartType;

/**
 * Configurable attributes for the Post views widget. The post scope and
 * report params reach it through WidgetRoot: the detail page seeds
 * `post_id` into the URL, and the dashboard date picker owns the range.
 *
 * @property chartType - How to draw the views series. Defaults to `line`.
 */
export type PostViewsAttributes = {
	chartType?: PostViewsChartType;
};

/**
 * The post detail Traffic view's view-trend card, the legacy Calypso post
 * summary chart (`stats-post-summary`): the scoped post's views over the
 * dashboard date range, with the window total as the metric headline. The
 * series comes from the `stats/post/{id}` daily history, bucketed client-side
 * at the page's chart interval; the `chartType` attribute
 * (`relevance: 'high'`) is rendered by the widget host.
 */
export default {
	icon: seen,
	attributes: [ chartTypeAttributeField() ] as WidgetAttributeField< PostViewsAttributes >[],
	example: {
		attributes: {
			chartType: 'line',
		},
	},
};
