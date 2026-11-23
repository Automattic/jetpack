/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import {
	HEADLINE_COUNT_FORMAT,
	MetricValue,
	StackedAreaChart,
	WidgetRoot,
	WidgetState,
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

export type RequestsBySourceAttributes = Record< never, never >;

type RequestsBySourceRenderAttributes = RequestsBySourceAttributes &
	Partial< ReportParamsFieldAttributes >;
type RequestsBySourceProps = WidgetRenderProps< RequestsBySourceRenderAttributes > & {
	/**
	 * Host callback to surface a widget error in the dashboard frame.
	 */
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

function RequestsBySourceInner() {
	const { reportParams } = useWidgetRootContext();
	const { sources, granularity, isLoading, isFetching, isError, isEmpty, refetch } =
		useRequestsBySource( reportParams );
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
								<MetricValue value={ source.total } dataFormat={ HEADLINE_COUNT_FORMAT } />
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
					<StackedAreaChart
						className={ styles.chart }
						series={ series }
						dataFormat={ HEADLINE_COUNT_FORMAT }
						tickResolution={ granularity }
					/>
				</div>
			</WidgetState>
		</div>
	);
}

export default function RequestsBySource( { attributes = {}, setError }: RequestsBySourceProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError }>
			<RequestsBySourceInner />
		</WidgetRoot>
	);
}
