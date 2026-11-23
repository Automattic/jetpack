/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import {
	ComparativeBarChart,
	HEADLINE_COUNT_FORMAT,
	MetricValue,
	StackedAreaChart,
	WidgetRoot,
	WidgetState,
	useChartRoleColor,
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
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

export type RequestsBySourceChartType = 'line' | 'bar';

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

/** Before the element mounts, and outside a charts scope. */
const BLOCKED_FALLBACK = '#d63638';

function RequestsBySourceInner( { chartType }: { chartType: RequestsBySourceChartType } ) {
	const { reportParams } = useWidgetRootContext();
	// What was refused takes the charts' own negative color, so it follows the theme.
	const [ rootRef, blockedColor ] = useChartRoleColor< HTMLDivElement >(
		'trend-down',
		BLOCKED_FALLBACK
	);
	const { sources, granularity, isLoading, isFetching, isError, isEmpty, refetch } =
		useRequestsBySource( reportParams, blockedColor );
	const series = useMemo( () => sources.map( source => source.series ), [ sources ] );
	// The totals double as the chart's legend, so they take its colors.
	const seriesStyles = useSeriesStyles( series );

	return (
		<div className={ styles.root } ref={ rootRef }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				isError={ isError }
				isEmpty={ isEmpty }
				error={ {
					description: __(
						"We couldn't load your requests. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
				} }
				empty={ {
					description: __( 'No requests in this period.', 'jetpack-premium-analytics-pkg' ),
				} }
			>
				<div className={ styles.body }>
					<ul className={ styles.totals }>
						{ sources.map( ( source, index ) => (
							<li key={ source.key } className={ styles.total }>
								<span className={ styles.label }>
									<span
										className={ styles.swatch }
										style={ { background: seriesStyles[ index ]?.stroke } }
										aria-hidden="true"
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
							tickResolution={ granularity }
						/>
					) : (
						<StackedAreaChart
							className={ styles.chart }
							series={ series }
							dataFormat={ HEADLINE_COUNT_FORMAT }
							tickResolution={ granularity }
						/>
					) }
				</div>
			</WidgetState>
		</div>
	);
}

export default function RequestsBySource( { attributes = {}, setError }: RequestsBySourceProps ) {
	// Coerce unknown persisted values to the default.
	const chartType = attributes?.chartType === 'bar' ? 'bar' : 'line';

	return (
		<WidgetRoot attributes={ attributes } setError={ setError }>
			<RequestsBySourceInner chartType={ chartType } />
		</WidgetRoot>
	);
}
