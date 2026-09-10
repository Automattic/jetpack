/**
 * External dependencies
 */
import { SelectField } from '@jetpack-premium-analytics/fields';
import { __, _x } from '@wordpress/i18n';
import { calendar } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import type { AllTimeTrafficMetric } from './build-all-time-traffic-rows';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

export type PostAllTimeTrafficAttributes = {
	/** Which number each cell reports; total views when unset. */
	metric?: AllTimeTrafficMetric;
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
	] as WidgetAttributeField< PostAllTimeTrafficAttributes >[],
	example: {
		attributes: { metric: 'total' },
	},
};
