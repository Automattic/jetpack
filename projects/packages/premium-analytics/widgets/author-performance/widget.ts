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

export type AuthorPerformanceChartType = ChartDisplayChartType;

/**
 * Configurable attributes for the Author views widget. The author scope reaches
 * it through WidgetRoot: the detail page seeds `author_id` into the URL.
 */
export type AuthorPerformanceAttributes = {
	chartType?: AuthorPerformanceChartType;
};

/**
 * Views per chart bucket, plus window totals for likes and comments, from
 * `stats/author/<id>`.
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
	] as WidgetAttributeField< AuthorPerformanceAttributes >[],
	example: {
		attributes: {
			chartType: 'bar',
		},
	},
};
