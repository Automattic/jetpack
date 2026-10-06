/**
 * External dependencies
 */
import {
	chartInterval,
	drawableIntervals,
	getAllowedIntervalsForPreset,
	getDefaultPreset,
	getStoreInfo,
	normalizeReportParams,
	type StatsPeriod,
} from '@jetpack-premium-analytics/data';
import { DateIntervalDropdown, getIntervalLabel } from '@jetpack-premium-analytics/ui';
import { __ } from '@wordpress/i18n';
import { useSearch } from '@wordpress/route';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { WIDGET_HEADER_TRIGGER_PROPS } from '../helpers/widget-header-trigger';
import type { DataFormControlProps } from '@jetpack-premium-analytics/externals';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

export type ChartIntervalFieldAttributes = {
	chartInterval?: StatsPeriod;
};

const STATS_PERIODS = [ 'hour', 'day', 'week', 'month', 'year' ] as const;

/**
 * Every bucket a chart may draw. A widget lists only its own chart's by overriding `elements`.
 */
export const CHART_INTERVAL_ELEMENTS = STATS_PERIODS.map( period => ( {
	value: period,
	label: getIntervalLabel( period ),
} ) );

function ChartIntervalControl( {
	data,
	field,
	onChange,
}: DataFormControlProps< ChartIntervalFieldAttributes > ) {
	// The host renders this outside the widget tree, so it reads the applied range off the route.
	const search = useSearch( { strict: false } ) as Parameters< typeof normalizeReportParams >[ 0 ];
	const elements = field.elements ?? CHART_INTERVAL_ELEMENTS;

	// Clamped like the chart, so the saved bucket shows again once the range allows it.
	const { options, value } = useMemo( () => {
		const periods = elements.map( ( { value: period } ) => period ) as [
			StatsPeriod,
			...StatsPeriod[],
		];
		const params = normalizeReportParams( search, getDefaultPreset( getStoreInfo().launchedDate ) );
		const allowed = getAllowedIntervalsForPreset(
			params.preset,
			params.from ?? '',
			params.to ?? ''
		);

		return {
			options: drawableIntervals( allowed, periods ),
			value: chartInterval( { ...params, interval: data.chartInterval }, periods ),
		};
	}, [ elements, search, data.chartInterval ] );

	return (
		<DateIntervalDropdown
			options={ options }
			value={ value }
			withLabel
			triggerProps={ WIDGET_HEADER_TRIGGER_PROPS }
			onChange={ next => onChange( { chartInterval: next as StatsPeriod } ) }
		/>
	);
}

/**
 * The "Chart interval" attribute a chart widget declares to save its own bucket size.
 */
export const chartIntervalField: WidgetAttributeField< ChartIntervalFieldAttributes > = {
	id: 'chartInterval',
	label: __( 'Chart interval', 'jetpack-premium-analytics-pkg' ),
	// The host renders a high-relevance field in the widget's own header.
	relevance: 'high',
	elements: CHART_INTERVAL_ELEMENTS,
	Edit: ChartIntervalControl as WidgetAttributeField< ChartIntervalFieldAttributes >[ 'Edit' ],
};
