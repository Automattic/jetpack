/**
 * External dependencies
 */
import {
	chartTypeAttributeField,
	type ChartDisplayChartType,
} from '@automattic/jetpack-premium-analytics-sdk';
import { chartBar } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * @property chartType - How the series is drawn. Defaults to `line`.
 */
export type BookingsOverTimeAttributes = {
	chartType?: ChartDisplayChartType;
};

export default {
	icon: chartBar,
	attributes: [ chartTypeAttributeField() ] as WidgetAttributeField< BookingsOverTimeAttributes >[],
};
