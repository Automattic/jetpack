/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Granularity the chart can be grouped by. `auto` follows the dashboard date
 * range (a wide range buckets by month, a narrow one by day); an explicit
 * value sticks across range changes.
 */
export type WordAdsChartTabsGranularity = 'auto' | 'day' | 'week' | 'month';

/**
 * Configurable attributes for the WordAds chart tabs widget. Report params still
 * reach it through WidgetRoot: the dashboard date range, or
 * `attributes.reportParams` when a host injects them (e.g. Storybook and
 * dashboard previews).
 *
 * @property granularity - Bucket size within the dashboard range. Defaults to `auto`.
 */
export type WordAdsChartTabsAttributes = {
	granularity?: WordAdsChartTabsGranularity;
};

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats `wordads-chart-tabs` card in wp-calypso (the
 * chart above the WordAds page). Renders the selected period's ads served,
 * average CPM, and revenue as selectable metric tabs — the upstream page's tab
 * labels and order — over a comparative line chart. The date range and
 * comparison state come from the dashboard via `reportParams`; the
 * `granularity` attribute (`relevance: 'high'`) chooses the bucket size within
 * that range. Requires WordAds to be active on the site.
 */
export default {
	name: 'jpa/wordads-chart-tabs',
	title: __( 'WordAds', 'jetpack-premium-analytics' ),
	description: __(
		'Compare ads served, average CPM, and revenue over the selected period, with the previous period overlaid for comparison.',
		'jetpack-premium-analytics'
	),
	icon: chartBar,
	attributes: [
		{
			id: 'granularity',
			label: __( 'Group by', 'jetpack-premium-analytics' ),
			type: 'text',
			elements: [
				{
					label: __( 'Auto', 'jetpack-premium-analytics' ),
					value: 'auto',
				},
				{
					label: __( 'By days', 'jetpack-premium-analytics' ),
					value: 'day',
				},
				{
					label: __( 'By weeks', 'jetpack-premium-analytics' ),
					value: 'week',
				},
				{
					label: __( 'By months', 'jetpack-premium-analytics' ),
					value: 'month',
				},
			],
			relevance: 'high',
		},
	] as WidgetAttributeField< WordAdsChartTabsAttributes >[],
	example: {
		attributes: {
			granularity: 'auto',
		},
	},
};
