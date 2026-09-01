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
	 * Not a user-facing control: the post detail page pins one per email tab, and
	 * exposing it would let a pinned tab contradict its own title.
	 */
	metric?: EmailTimeSeriesMetric;
	chartType?: EmailTimeSeriesChartType;
};

/**
 * Ported from the legacy email detail page's opens/clicks-over-time chart
 * (`stats-email-chart-tabs`). The host scopes the email through
 * `reportParams.post_id` and hands it the report range — on the post detail
 * page, the first 30 days after the send, in daily buckets.
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
