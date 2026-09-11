/**
 * External dependencies
 */
import { SelectField } from '@jetpack-premium-analytics/fields';
import { __, _x } from '@wordpress/i18n';
import { calendar } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import type { ViewsOverYearsMetric } from './build-views-over-years';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

export type ViewsOverYearsAttributes = {
	/** Which number each cell reports; total views when unset. */
	metric?: ViewsOverYearsMetric;
};

// `relevance: 'high'`: the framed host draws the select in the widget header,
// where the design puts the Total views / Daily average switch.
export default {
	icon: calendar,
	attributes: [
		{
			id: 'metric',
			label: _x( 'Metric', 'label for the views metric selector', 'jetpack-premium-analytics-pkg' ),
			type: 'text',
			relevance: 'high',
			Edit: SelectField,
			elements: [
				{ value: 'total', label: __( 'Total views', 'jetpack-premium-analytics-pkg' ) },
				{ value: 'average', label: __( 'Daily average', 'jetpack-premium-analytics-pkg' ) },
			],
		},
	] as WidgetAttributeField< ViewsOverYearsAttributes >[],
	example: {
		attributes: { metric: 'total' },
	},
};
