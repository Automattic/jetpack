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
		chartTypeAttributeField(),
	] as WidgetAttributeField< AuthorPerformanceAttributes >[],
	example: {
		attributes: {
			chartType: 'bar',
		},
	},
};
