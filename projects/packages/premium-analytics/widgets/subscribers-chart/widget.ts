/**
 * WordPress dependencies
 */
import { __, _n } from '@wordpress/i18n';
import { people } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * External dependencies
 */
import {
	reportParamsAttributeField,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/fields';
import {
	chartTypeAttributeField,
	type ChartDisplayChartType,
	type CountLabel,
} from '@jetpack-premium-analytics/widgets-toolkit';

/**
 * Internal dependencies
 */
import { DEFAULT_REPORT_PARAMS } from './default-report-params';
import { SUBSCRIBERS_GRAIN } from './grain';

/**
 * How the selected metric is drawn. The shared chart-display list keeps every
 * chart widget's dropdown identical and ties it to the toolkit's own union.
 */
export type SubscribersChartType = ChartDisplayChartType;

/**
 * The metric tabs the chart shows, in display order: the id, label and tooltip
 * unit of each metric. The Paid subscribers tab only renders when the site has paid
 * subscribers.
 */
export const SUBSCRIBERS_CHART_METRICS = [
	{
		id: 'subscribers',
		label: __( 'Subscribers', 'jetpack-premium-analytics-pkg' ),
		countLabel: count =>
			/* translators: %s: number of subscribers. */
			_n( '%s subscriber', '%s subscribers', count, 'jetpack-premium-analytics-pkg' ),
	},
	{
		id: 'paid',
		label: __( 'Paid subscribers', 'jetpack-premium-analytics-pkg' ),
		countLabel: count =>
			/* translators: %s: number of paid subscribers. */
			_n( '%s paid subscriber', '%s paid subscribers', count, 'jetpack-premium-analytics-pkg' ),
	},
] as const satisfies readonly { id: string; label: string; countLabel: CountLabel }[];

/**
 * Identifier of one metric tab.
 */
export type SubscribersChartMetricId = ( typeof SUBSCRIBERS_CHART_METRICS )[ number ][ 'id' ];

/**
 * The widget owns its date control because no other Subscribers widget reads a range.
 *
 * @property chartType - How to draw the selected metric. Defaults to `line`.
 */
export type SubscribersChartAttributes = Partial< ReportParamsFieldAttributes > & {
	chartType?: SubscribersChartType;
};

/**
 * Ported from the Jetpack Stats `stats-subscribers-chart-section` card. The
 * bucket size follows the selected window rather than a control of its own, so
 * the date field offers the window alone.
 * `example.attributes` doubles as the defaults applied to new instances.
 */
export default {
	icon: people,
	attributes: [
		reportParamsAttributeField< SubscribersChartAttributes >( {
			grain: SUBSCRIBERS_GRAIN,
			offersComparison: false,
		} ),
		chartTypeAttributeField(),
	] as WidgetAttributeField< SubscribersChartAttributes >[],
	example: {
		attributes: {
			reportParams: DEFAULT_REPORT_PARAMS,
			chartType: 'line',
		},
	},
};
