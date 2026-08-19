/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { trendingUp } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import {
	chartTypeAttributeField,
	granularityAttributeField,
	type ChartDisplayChartType,
} from '@jetpack-premium-analytics/widgets-toolkit';

/**
 * Bucket size the chart groups by. There is no `auto`: the bucket follows the
 * dashboard's interval control until a reader picks one here, and goes back to
 * following it the next time that control moves.
 */
export type TrafficChartGranularity = 'hour' | 'day' | 'week' | 'month';

/**
 * How the selected metric is drawn. The shared chart-display list keeps every
 * chart widget's dropdown identical and ties it to the toolkit's own union.
 */
export type TrafficChartType = ChartDisplayChartType;

/**
 * The metric tabs the chart shows, in display order: the id and label of each
 * metric. The id doubles as the visits `stat_fields` field the tab reads.
 */
export const TRAFFIC_CHART_METRICS = [
	{ id: 'views', label: __( 'Views', 'jetpack-premium-analytics-pkg' ) },
	{ id: 'visitors', label: __( 'Visitors', 'jetpack-premium-analytics-pkg' ) },
	{ id: 'comments', label: __( 'Comments', 'jetpack-premium-analytics-pkg' ) },
	{ id: 'likes', label: __( 'Likes', 'jetpack-premium-analytics-pkg' ) },
] as const satisfies readonly { id: string; label: string }[];

/**
 * Configurable attributes for the Traffic chart widget. Report params still
 * reach it through WidgetRoot: the dashboard date range, or
 * `attributes.reportParams` when a host injects them (e.g. Storybook and
 * dashboard previews).
 *
 * @property granularity - Bucket size to group by. Follows the dashboard interval when absent.
 * @property chartType   - How to draw the selected metric. Defaults to `line`.
 */
export type TrafficChartAttributes = {
	granularity?: TrafficChartGranularity;
	chartType?: TrafficChartType;
};

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats `stats-chart-tabs` card in wp-calypso (the chart
 * above the Traffic page). Renders the selected period's Views, Visitors,
 * Comments, and Likes as selectable metric tabs over a comparative chart. The
 * date range and comparison state come from the dashboard via `reportParams`;
 * the `granularity` attribute (`relevance: 'high'`) is the bucket size, seeded
 * and re-seeded from the dashboard's interval control, and `chartType` switches
 * between lines and bars. Which metric is plotted is the chart's own tab
 * selection, not an attribute.
 * `example.attributes` doubles as the defaults applied to new instances.
 */
export default {
	icon: trendingUp,
	attributes: [
		granularityAttributeField( [ 'hour', 'day', 'week', 'month' ] ),
		chartTypeAttributeField(),
	] as WidgetAttributeField< TrafficChartAttributes >[],
	example: {
		attributes: {
			chartType: 'line',
		},
	},
};
