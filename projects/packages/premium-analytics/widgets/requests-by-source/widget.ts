/**
 * External dependencies
 */
import {
	chartIntervalAttributeField,
	chartIntervalElements,
	type ChartIntervalFieldAttributes,
} from '@jetpack-premium-analytics/fields';
import type { StatsPeriod } from '@jetpack-premium-analytics/data';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * The bucket sizes this chart draws: the edge serves hours and days, and days fold into weeks and months.
 */
export const REQUESTS_BY_SOURCE_PERIODS = [
	'hour',
	'day',
	'week',
	'month',
] as const satisfies readonly StatsPeriod[];

export type RequestsBySourcePeriod = ( typeof REQUESTS_BY_SOURCE_PERIODS )[ number ];

export type RequestsBySourceChartType = 'area' | 'bar';

/**
 * @property chartType     - How the sources are drawn over time: stacked areas or stacked bars.
 * @property chartInterval - The bucket size. Defaults to the one the date range suggests.
 */
export type RequestsBySourceAttributes = ChartIntervalFieldAttributes< RequestsBySourcePeriod > & {
	chartType?: RequestsBySourceChartType;
};

export default {
	attributes: [
		{
			...chartIntervalAttributeField< RequestsBySourceAttributes >(),
			elements: chartIntervalElements( REQUESTS_BY_SOURCE_PERIODS ),
		},
	] as WidgetAttributeField< RequestsBySourceAttributes >[],
	example: {
		attributes: {},
	},
};
