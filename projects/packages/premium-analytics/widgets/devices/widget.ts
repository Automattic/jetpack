/**
 * External dependencies
 */
import {
	chartIntervalAttributeField,
	chartIntervalElements,
	type ChartIntervalFieldAttributes,
} from '@jetpack-premium-analytics/fields';
import { createElement, type ComponentType } from 'react';
import { STATS_DEVICES_PERIODS, type StatsDevicesPeriod } from '@jetpack-premium-analytics/data';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

export type DevicesChartGranularity = StatsDevicesPeriod;

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
			elements: chartIntervalElements( STATS_DEVICES_PERIODS ),
			// The semi-circle reads the whole range, so only the bars have a bucket to pick.
			Edit: ( props: IntervalEditProps ) =>
				props.data.chartType === 'bar' ? createElement( IntervalEdit, props ) : null,
		},
	] as WidgetAttributeField< DevicesAttributes >[],
	example: {
		attributes: {},
	},
};
