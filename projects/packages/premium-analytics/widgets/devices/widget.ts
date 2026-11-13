/**
 * External dependencies
 */
import {
	chartIntervalAttributeField,
	chartIntervalElements,
	type ChartIntervalFieldAttributes,
} from '@jetpack-premium-analytics/fields';
import { createElement, type ComponentType } from 'react';
import type { StatsPeriod } from '@jetpack-premium-analytics/data';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/** The bucket sizes the bar chart draws; the devices endpoint has no hourly data. */
export const DEVICES_PERIODS = [
	'day',
	'week',
	'month',
	'quarter',
	'year',
] as const satisfies readonly StatsPeriod[];

export type DevicesChartGranularity = ( typeof DEVICES_PERIODS )[ number ];

/** The share of each device over the range, or its views in each bucket of the range. */
export type DevicesChartType = 'half-ring' | 'bar';

/**
 * @property chartType     - How the views are drawn. Defaults to `half-ring`.
 * @property chartInterval - The bar chart's bucket size. Defaults to the one the date range suggests.
 */
export type DevicesAttributes = ChartIntervalFieldAttributes< DevicesChartGranularity > & {
	chartType?: DevicesChartType;
};

const intervalField = chartIntervalAttributeField< DevicesAttributes >();
type IntervalEditProps = { data: DevicesAttributes } & Record< string, unknown >;
const IntervalEdit = intervalField.Edit as ComponentType< IntervalEditProps >;

export default {
	attributes: [
		{
			...intervalField,
			elements: chartIntervalElements( DEVICES_PERIODS ),
			// The semi-circle reads the whole range, so only the bars have a bucket to pick.
			Edit: ( props: IntervalEditProps ) =>
				props.data.chartType === 'bar' ? createElement( IntervalEdit, props ) : null,
		},
	] as WidgetAttributeField< DevicesAttributes >[],
	example: {
		attributes: {},
	},
};
