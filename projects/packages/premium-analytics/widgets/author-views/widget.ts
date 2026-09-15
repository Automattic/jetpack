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

export type AuthorViewsChartType = ChartDisplayChartType;

/**
 * Configurable attributes for the Author views widget. The author scope reaches
 * it through WidgetRoot: the detail page seeds `author_id` into the URL.
 */
export type AuthorViewsAttributes = {
	chartType?: AuthorViewsChartType;
};

/**
 * The series is this author's row read out of every `stats/top-authors` bucket
 * over the page's chart interval.
 */
export default {
	icon: seen,
	attributes: [ chartTypeAttributeField() ] as WidgetAttributeField< AuthorViewsAttributes >[],
	example: {
		attributes: {
			chartType: 'bar',
		},
	},
};
