/**
 * External dependencies
 */
import {
	buildMetricTab,
	ChartEmptyState,
	type ChartDisplayChartType,
	MetricTabsChart,
	MetricTabsChartSkeleton,
	useWidgetRootContext,
	WidgetRoot,
	WidgetState,
	type ReportParamsFieldAttributes,
	type ReportResult,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useMemo, useState } from 'react';
/**
 * Internal dependencies
 */
import styles from './store-performance.module.css';
import { useStorePerformanceMetrics } from './use-store-performance-metrics';
import type { StorePerformanceAttributes } from './widget';
import type { ReportParams } from '../../src/reports';
import type { StorePerformanceMetric } from '../../src/store-performance/metric';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/** Chart format for the metrics that set none. */
const DEFAULT_DATA_FORMAT = {
	type: 'number' as const,
	options: { useMultipliers: true, decimals: 0 },
};

type StorePerformanceRenderAttributes = StorePerformanceAttributes &
	Partial< ReportParamsFieldAttributes >;

/** What the chart reads of a metric's report. */
type MetricReportState = {
	primary: unknown;
	comparison: unknown;
	hasComparison: boolean;
	periodStarts?: ReportResult< unknown >[ 'periodStarts' ];
	timezone: string;
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	hasData: boolean;
	refetch: () => Promise< unknown >;
};

type MetricReportProps = {
	metric: StorePerformanceMetric;
	params: ReportParams;
	onChange: ( id: string, state: MetricReportState | null ) => void;
};

/**
 * Runs one metric's report hook. The metrics are a list a plugin can add to, and hooks cannot run
 * in a loop, so each metric gets a child; the report reaches the chart by its fields, since the
 * hook returns a new object on every render.
 *
 * @param {MetricReportProps} props - The metric, the report params and where to report.
 * @return {null} Nothing: the chart is the parent's.
 */
function MetricReport( { metric, params, onChange }: MetricReportProps ) {
	const { useReport } = metric;
	const report = useReport( params );
	const {
		hasComparison,
		periodStarts,
		timezone,
		isLoading,
		isFetching,
		isError,
		hasData,
		refetch,
	} = report;
	const primary = report.primary.data;
	const comparison = report.comparison.data;

	const state = useMemo< MetricReportState >(
		() => ( {
			primary,
			comparison,
			hasComparison,
			periodStarts,
			timezone,
			isLoading,
			isFetching,
			isError,
			hasData,
			refetch,
		} ),
		[
			primary,
			comparison,
			hasComparison,
			periodStarts,
			timezone,
			isLoading,
			isFetching,
			isError,
			hasData,
			refetch,
		]
	);

	useEffect( () => {
		onChange( metric.id, state );
	}, [ metric.id, onChange, state ] );

	useEffect( () => () => onChange( metric.id, null ), [ metric.id, onChange ] );

	return null;
}

type StorePerformanceProps = {
	/** The metrics switched off, by id. */
	hiddenMetricIds?: string[];
	/** How the selected metric is drawn. */
	chartType?: ChartDisplayChartType;
};

/**
 * The selected store metrics as tabs over a comparison chart, read under the widget root for its
 * report params. Only the reports of the shown metrics are requested.
 *
 * @param {StorePerformanceProps} props - The component props.
 * @return {JSX.Element} The chart, or the loading or error state of its reports.
 */
function StorePerformance( { hiddenMetricIds, chartType }: StorePerformanceProps ) {
	const { reportParams } = useWidgetRootContext();
	const offered = useStorePerformanceMetrics();

	// Resolved against the list on offer, so a metric registered later shows unless hidden.
	const metrics = useMemo( () => {
		const hidden = new Set( hiddenMetricIds );
		return offered.filter( metric => ! hidden.has( metric.id ) );
	}, [ hiddenMetricIds, offered ] );

	const [ reports, setReports ] = useState< Record< string, MetricReportState > >( {} );
	const onReportChange = useCallback( ( id: string, state: MetricReportState | null ) => {
		setReports( previous => {
			if ( state === null ) {
				if ( ! ( id in previous ) ) {
					return previous;
				}
				const next = { ...previous };
				delete next[ id ];
				return next;
			}
			return previous[ id ] === state ? previous : { ...previous, [ id ]: state };
		} );
	}, [] );

	const reportList = useMemo(
		() =>
			metrics
				.map( metric => reports[ metric.id ] )
				.filter( ( report ): report is MetricReportState => report !== undefined ),
		[ metrics, reports ]
	);

	const tabs = useMemo(
		() =>
			metrics.flatMap( metric => {
				const report = reports[ metric.id ];
				if ( ! report ) {
					return [];
				}

				return [
					{
						...buildMetricTab( {
							primary: report.primary,
							comparison: report.comparison,
							hasComparison: report.hasComparison,
							field: metric.field,
							label: metric.label,
							dataFormat: metric.dataFormat,
							countLabel: metric.countLabel,
							noDataLabel: metric.noDataLabel,
							zone: report.timezone,
							periodStarts: report.periodStarts,
						} ),
						key: metric.id,
						description: metric.description,
					},
				];
			} ),
		[ metrics, reports ]
	);

	// A failed report shows its error beside the others' charts only once it has nothing to show.
	const isError = reportList.some( report => report.isError && ! report.hasData );
	// Retry re-runs every report, not only the failed one.
	const refetch = useCallback(
		() => Promise.all( reportList.map( report => report.refetch() ) ),
		[ reportList ]
	);

	// Not a data state: every metric was switched off in the widget settings.
	if ( metrics.length === 0 ) {
		return (
			<div className={ styles.root }>
				<ChartEmptyState
					text={ __( 'Select at least one metric to display.', 'jetpack-woocommerce-stats-pkg' ) }
				/>
			</div>
		);
	}

	return (
		<div className={ styles.root }>
			{ metrics.map( metric => (
				<MetricReport
					key={ metric.id }
					metric={ metric }
					params={ reportParams }
					onChange={ onReportChange }
				/>
			) ) }
			<WidgetState
				isLoading={
					reportList.length < metrics.length || reportList.some( report => report.isLoading )
				}
				isFetching={ reportList.some( report => report.isFetching ) }
				isError={ isError }
				error={ {
					description: __(
						"We couldn't load store performance data. Please try again in a moment.",
						'jetpack-woocommerce-stats-pkg'
					),
					actions: [ { label: __( 'Retry', 'jetpack-woocommerce-stats-pkg' ), onClick: refetch } ],
				} }
				renderLoading={ <MetricTabsChartSkeleton /> }
			>
				<MetricTabsChart
					metrics={ tabs }
					chartType={ chartType }
					dataFormat={ DEFAULT_DATA_FORMAT }
					groupLabel={ __( 'Store metric', 'jetpack-woocommerce-stats-pkg' ) }
					chartTitle={ __( 'Store performance', 'jetpack-woocommerce-stats-pkg' ) }
					empty={ <ChartEmptyState /> }
				/>
			</WidgetState>
		</div>
	);
}

/**
 * The Store performance widget: every metric on offer but the ones `hiddenMetrics` names.
 *
 * @param {WidgetRenderProps< StorePerformanceRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function StorePerformanceRender( {
	attributes = {},
}: WidgetRenderProps< StorePerformanceRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<StorePerformance
				hiddenMetricIds={ attributes.hiddenMetrics }
				chartType={ attributes.chartType }
			/>
		</WidgetRoot>
	);
}
