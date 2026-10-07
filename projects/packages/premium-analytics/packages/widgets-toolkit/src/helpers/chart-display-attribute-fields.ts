/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import type { LineOrBar } from '@jetpack-premium-analytics/fields';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * How a chart widget draws its series: what the `jpa/line-or-bar` control writes.
 */
export type ChartDisplayChartType = LineOrBar;

/**
 * The "Chart type" attribute as a widget declares it by hand; the `jpa/line-or-bar` field type
 * owns the options. Kept for the widgets that still call it.
 */
export function chartTypeAttributeField<
	Attributes extends { chartType?: ChartDisplayChartType },
>(): WidgetAttributeField< Attributes > {
	return {
		id: 'chartType',
		label: __( 'Chart type', 'jetpack-premium-analytics-pkg' ),
		type: 'jpa/line-or-bar',
		relevance: 'high',
	} as WidgetAttributeField< Attributes >;
}
