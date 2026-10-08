/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { seen } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import {
	CHART_TYPE_ELEMENTS,
	type ChartDisplayChartType,
} from '@jetpack-premium-analytics/widgets-toolkit';

/**
 * How the views series is drawn. The shared chart-display list keeps every
 * chart widget's dropdown identical and ties it to the toolkit's own union.
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
	icon: seen,
	attributes: [
		{
			id: 'chartType',
			label: __( 'Chart type', 'jetpack-premium-analytics-pkg' ),
			type: 'jpa/toggle-group',
			elements: CHART_TYPE_ELEMENTS,
			relevance: 'high',
		},
	] as WidgetAttributeField< PostViewsAttributes >[],
	example: {
		attributes: {
			chartType: 'bar',
		},
	},
};
