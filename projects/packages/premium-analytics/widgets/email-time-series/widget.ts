/**
 * WordPress dependencies
 */
import { envelope } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import {
	chartTypeAttributeField,
	type ChartDisplayChartType,
} from '@jetpack-premium-analytics/widgets-toolkit';

/**
 * Which timeline the chart draws for the selected email.
 */
export type EmailTimeSeriesMetric = 'opens' | 'clicks';

/**
 * How the timeline is drawn. The shared chart-display list keeps every chart
 * widget's dropdown identical and ties it to the toolkit's own union.
 */
export type EmailTimeSeriesChartType = ChartDisplayChartType;

/**
 * Configurable attributes for the Email performance widget.
 */
export type EmailTimeSeriesAttributes = {
	/**
	 * Which timeline to draw: opens (default) or clicks. The post detail page
	 * pins one per email tab through the tab layout, so this is not a
	 * user-facing control — exposing it would let a pinned tab contradict its
	 * own title.
	 */
	metric?: EmailTimeSeriesMetric;
	/**
	 * How to draw the timeline (`relevance: 'high'`). Defaults to `line`.
	 */
	chartType?: EmailTimeSeriesChartType;
};

/**
 * Widget type definition.
 *
 * The opens/clicks-over-time chart from the legacy email detail page
 * (`stats-email-chart-tabs`), with the window total as the metric headline.
 * The email is scoped by the host through `reportParams.post_id` (the shared
 * single-resource "detail page" param); the timeline spans the dashboard
 * date range and is bucketed at the page's chart interval.
 */
export default {
	icon: envelope,
	attributes: [ chartTypeAttributeField() ] as WidgetAttributeField< EmailTimeSeriesAttributes >[],
	example: {
		attributes: {
			metric: 'opens',
			chartType: 'line',
		},
	},
};
