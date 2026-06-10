/**
 * External dependencies
 */
import { useGlobalChartsContext } from '@automattic/charts';
import { useReportStatsVisits } from '@jetpack-premium-analytics/data';
import { useEffect, useMemo } from 'react';
/**
 * Internal dependencies
 */
import { buildVisitsSeries } from '../../helpers';
import { ComparativeLineChart } from '../chart-comparative-line';
import { WidgetErrorNotice } from '../widget-error-notice';
import { WidgetLoadingOverlay } from '../widget-loading-overlay';
import type { SeriesStyle } from '../chart-comparative-line';
import type { DataFormat, TrafficChartAttributes } from '../../types';
import type { StatsVisitsField } from '@jetpack-premium-analytics/data';

type TrafficChartWidgetProps = Required< Pick< TrafficChartAttributes, 'unit' | 'quantity' > >;

const STAT_FIELDS: StatsVisitsField[] = [ 'views', 'visitors' ];

const DATA_FORMAT: DataFormat = { type: 'number' };

/**
 * Traffic chart widget body.
 *
 * Fetches visit counts for the configured period and renders Views and
 * Visitors as parallel line series. Must render inside a `WidgetRoot`, which
 * provides the query client and chart theme.
 *
 * @param props          - Component props.
 * @param props.unit     - Stats period granularity.
 * @param props.quantity - Number of periods to chart.
 */
export function TrafficChartWidget( { unit, quantity }: TrafficChartWidgetProps ) {
	const { getElementStyles } = useGlobalChartsContext();

	const { data, isLoading, isFetching, isError, error, refetch } = useReportStatsVisits( {
		unit,
		quantity,
		statFields: STAT_FIELDS,
	} );

	const hasData = Boolean( data?.data?.length );
	const isInitialLoading = isLoading && ! hasData;
	const isRefetching = ( isLoading || isFetching ) && hasData;

	const series = useMemo( () => buildVisitsSeries( data ), [ data ] );

	const seriesStyles = useMemo< SeriesStyle[] >(
		() =>
			series.map( ( seriesData, index ) => {
				const { color, lineStyles } = getElementStyles( { data: seriesData, index } );

				return { stroke: color, ...lineStyles };
			} ),
		[ series, getElementStyles ]
	);

	// Log once per error transition, not on every render. Captures API errors,
	// network failures, etc. for debugging.
	useEffect( () => {
		if ( isError && error ) {
			// eslint-disable-next-line no-console
			console.error( '[Widget Error]', error.message, error );
		}
	}, [ isError, error ] );

	if ( isError ) {
		// Inline error UI: the host widget contract has no setError channel.
		return <WidgetErrorNotice onRetry={ refetch } />;
	}

	return (
		<>
			<ComparativeLineChart
				series={ series }
				styles={ seriesStyles }
				dataFormat={ DATA_FORMAT }
				tickFormat="short"
			/>
			{ ( isInitialLoading || isRefetching ) && <WidgetLoadingOverlay /> }
		</>
	);
}
