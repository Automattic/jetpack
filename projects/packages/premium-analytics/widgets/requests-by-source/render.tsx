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
import clsx from 'clsx';
import { useCallback, useMemo, useState } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import useRequestsBySource from './use-requests-by-source';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { RequestSource } from './use-requests-by-source';
import type { ComponentProps } from 'react';

export type RequestsBySourceChartType = 'area' | 'bar';

export type RequestsBySourceAttributes = {
	/** How the sources are drawn over time: stacked areas or stacked bars. */
	chartType?: RequestsBySourceChartType;
};

type RequestsBySourceRenderAttributes = RequestsBySourceAttributes &
	Partial< ReportParamsFieldAttributes >;
type RequestsBySourceProps = WidgetRenderProps< RequestsBySourceRenderAttributes > & {
	/**
	 * Host callback to surface a widget error in the dashboard frame.
	 */
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

type SourceTotalProps = {
	source: RequestSource;
	indicatorStyle: ComponentProps< typeof SeriesIndicator >[ 'style' ];
	chartType: RequestsBySourceChartType;
	isPressed: boolean;
	isDimmed: boolean;
	onToggle: ( key: RequestSource[ 'key' ] ) => void;
};

/** A source's total, which doubles as its legend item and as the switch that brings it out. */
function SourceTotal( {
	source,
	indicatorStyle,
	chartType,
	isPressed,
	isDimmed,
	onToggle,
}: SourceTotalProps ) {
	const toggle = useCallback( () => onToggle( source.key ), [ onToggle, source.key ] );

	return (
		<li className={ styles.totalItem }>
			<button
				type="button"
				className={ clsx( styles.total, { [ styles.isDimmed ]: isDimmed } ) }
				aria-pressed={ isPressed }
				onClick={ toggle }
			>
				<span className={ styles.label }>
					{ /* A line for the outlined areas, a block for the bars, as the tooltip marks them. */ }
					<SeriesIndicator
						indicatorType={ chartType === 'bar' ? 'rect' : 'line' }
						style={ indicatorStyle }
					/>
					{ source.label }
				</span>
				<MetricValue value={ source.total } dataFormat={ HEADLINE_COUNT_FORMAT } fontSize="2xl" />
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
			</button>
		</li>
	);
}

function RequestsBySourceInner( { chartType }: { chartType: RequestsBySourceChartType } ) {
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
	} = useRequestsBySource( reportParams );
	const series = useMemo( () => sources.map( source => source.series ), [ sources ] );
	// The totals double as the chart's legend, so they take its colors.
	const seriesStyles = useSeriesStyles( series );
	const [ emphasizedKey, setEmphasizedKey ] = useState< RequestSource[ 'key' ] | null >( null );
	const toggleEmphasis = useCallback(
		( key: RequestSource[ 'key' ] ) =>
			setEmphasizedKey( current => ( current === key ? null : key ) ),
		[]
	);
	const emphasizedIndex = sources.findIndex( source => source.key === emphasizedKey );

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
							<SourceTotal
								key={ source.key }
								source={ source }
								indicatorStyle={ seriesStyles[ index ] }
								chartType={ chartType }
								isPressed={ index === emphasizedIndex }
								isDimmed={ emphasizedIndex !== -1 && index !== emphasizedIndex }
								onToggle={ toggleEmphasis }
							/>
						) ) }
					</ul>
					{ chartType === 'bar' ? (
						<ComparativeBarChart
							className={ styles.chart }
							series={ series }
							layout="stacked"
							showLegend={ false }
							emphasizedSeries={ sources[ emphasizedIndex ]?.label ?? null }
							dataFormat={ HEADLINE_COUNT_FORMAT }
							tickResolution={ period }
						/>
					) : (
						<StackedAreaChart
							className={ styles.chart }
							series={ series }
							dataFormat={ HEADLINE_COUNT_FORMAT }
							tickResolution={ period }
							emphasizedIndex={ emphasizedIndex === -1 ? null : emphasizedIndex }
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
			<RequestsBySourceInner chartType={ chartType } />
		</WidgetRoot>
	);
}
