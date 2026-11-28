/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import {
	ComparativeBarChart,
	HEADLINE_COUNT_FORMAT,
	MetricValue,
	SeriesIndicator,
	StackedAreaChart,
	WidgetRoot,
	WidgetState,
	describeError,
	useSeriesStyles,
	useWidgetRootContext,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import useRequestsBySource from './use-requests-by-source';
import type {
	RequestsBySourceAttributes,
	RequestsBySourceChartType,
	RequestsBySourcePeriod,
} from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

type RequestsBySourceRenderAttributes = RequestsBySourceAttributes &
	Partial< ReportParamsFieldAttributes >;
type RequestsBySourceProps = WidgetRenderProps< RequestsBySourceRenderAttributes > & {
	/**
	 * Host callback to surface a widget error in the dashboard frame.
	 */
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

type RequestsBySourceInnerProps = {
	chartType: RequestsBySourceChartType;
	interval?: RequestsBySourcePeriod;
};

function RequestsBySourceInner( { chartType, interval }: RequestsBySourceInnerProps ) {
	const { reportParams } = useWidgetRootContext();
	const {
		sources,
		period,
		isLoading,
		isFetching,
		isError,
		isEmpty,
		isRangeTooLong,
		error,
		refetch,
	} = useRequestsBySource( reportParams, interval );
	const series = useMemo( () => sources.map( source => source.series ), [ sources ] );
	// The totals double as the chart's legend, so they take its colors.
	const seriesStyles = useSeriesStyles( series );

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				isError={ isError }
				isEmpty={ isEmpty }
				error={ describeError( error, {
					retryDescription: __(
						"We couldn't load your requests. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					onRetry: refetch,
				} ) }
				empty={
					isRangeTooLong
						? {
								description: __(
									'Requests are available for up to a year at a time. Choose a shorter period.',
									'jetpack-premium-analytics-pkg'
								),
							}
						: undefined
				}
			>
				<div className={ styles.body }>
					<ul className={ styles.totals }>
						{ sources.map( ( source, index ) => (
							<li key={ source.key } className={ styles.total }>
								<span className={ styles.label }>
									{ /* A line for the outlined areas, a block for the bars, as the tooltip marks them. */ }
									<SeriesIndicator
										indicatorType={ chartType === 'bar' ? 'rect' : 'line' }
										style={ seriesStyles[ index ] }
									/>
									{ source.label }
								</span>
								<MetricValue
									value={ source.total }
									dataFormat={ HEADLINE_COUNT_FORMAT }
									fontSize="2xl"
								/>
								{ source.share !== null && (
									<span className={ styles.share }>
										{ sprintf(
											/* translators: %s: a percentage, e.g. "12.5%". */
											__( '%s of requests', 'jetpack-premium-analytics-pkg' ),
											formatMetricValue( source.share, 'percentage', {
												decimals: 1,
												signDisplay: 'never',
											} )
										) }
									</span>
								) }
							</li>
						) ) }
					</ul>
					{ chartType === 'bar' ? (
						<ComparativeBarChart
							className={ styles.chart }
							series={ series }
							layout="stacked"
							dataFormat={ HEADLINE_COUNT_FORMAT }
							tickResolution={ period }
							showLegend={ false }
						/>
					) : (
						<StackedAreaChart
							className={ styles.chart }
							series={ series }
							dataFormat={ HEADLINE_COUNT_FORMAT }
							tickResolution={ period }
						/>
					) }
				</div>
			</WidgetState>
		</div>
	);
}

export default function RequestsBySource( { attributes = {}, setError }: RequestsBySourceProps ) {
	// Coerce unknown persisted values to the default.
	const chartType = attributes?.chartType === 'bar' ? 'bar' : 'area';

	return (
		<WidgetRoot attributes={ attributes } setError={ setError }>
			<RequestsBySourceInner chartType={ chartType } interval={ attributes.chartInterval } />
		</WidgetRoot>
	);
}
