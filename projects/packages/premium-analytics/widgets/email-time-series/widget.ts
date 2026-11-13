/**
 * Internal dependencies
 */
import {
	DEFAULT_EMAIL_SEND_WINDOW,
	isEmailSendWindow,
	type EmailSendWindow,
} from '@jetpack-premium-analytics/data';
import type { ChartDisplayChartType } from '@jetpack-premium-analytics/widgets-toolkit';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Which timeline the chart draws for the selected email.
 */
export type EmailTimeSeriesMetric = 'opens' | 'clicks';

/**
 * How the timeline is drawn. The alias ties the attribute to the toolkit's
 * own union, which the chart reads.
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
	/** How far past the send the chart reaches, which also settles the bucket it draws. */
	sendWindow?: EmailSendWindow;
};

/**
 * Ported from the legacy email detail page's opens/clicks-over-time chart
 * (`stats-email-chart-tabs`). The host scopes the email through
 * `reportParams.post_id` and starts the report range at the send; the chart's
 * own window control decides how far past it the timeline reaches.
 */
export default {
	attributes: [
		{
			id: 'sendWindow',
			getValue: ( { item }: { item: EmailTimeSeriesAttributes } ) =>
				isEmailSendWindow( item.sendWindow ) ? item.sendWindow : DEFAULT_EMAIL_SEND_WINDOW,
		},
	] as WidgetAttributeField< EmailTimeSeriesAttributes >[],
	example: {
		attributes: {
			metric: 'opens',
			chartType: 'line',
		},
	},
};
