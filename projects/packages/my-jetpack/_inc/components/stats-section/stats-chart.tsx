import { BarChart, DataPointDate } from '@automattic/charts';
import { __ } from '@wordpress/i18n';
import { Icon, info } from '@wordpress/icons';
import React, { Suspense, useCallback, useMemo, ReactElement, KeyboardEvent } from 'react';
import LoadingBlock from '../loading-block';
import StatsChartTooltip from './stats-chart-tooltip';
import styles from './stats-chart.module.scss';

interface ChartDataPoint {
	date: Date;
	value: number;
}

interface ChartSeries {
	label: string;
	data: ChartDataPoint[];
	options: {
		stroke: string;
	};
}

interface StatsChartProps {
	data: ChartSeries[];
	isLoading: boolean;
	onClick: () => void;
	onKeyDown: ( e: KeyboardEvent< HTMLDivElement > ) => void;
	selectedMetric: string;
	metricIcon: ReactElement;
}

/**
 * Stats chart component with bar chart visualization.
 * @param {object}   props            - Component props.
 * @param {object}   props.data       - Chart data.
 * @param {boolean}  props.isLoading  - Whether the chart is loading.
 * @param {Function} props.onClick    - Click handler.
 * @param {Function} props.onKeyDown  - Keydown handler.
 * @param {object}   props.metricIcon - The icon JSX element for the selected metric.
 * @return {object} StatsChart React component.
 */
const StatsChart: React.FC< StatsChartProps > = ( {
	data,
	isLoading,
	onClick,
	onKeyDown,
	metricIcon,
} ) => {
	// Check if there's data for the selected metric specifically
	const isEmpty = useMemo( () => {
		return ! isLoading && data?.[ 0 ]?.data?.every( item => item.value === 0 );
	}, [ data, isLoading ] );

	// Calculate Y-domain to ensure 0-value guideline appears at bottom
	const yDomain = useMemo( (): [ number, number ] => {
		if ( isEmpty || ! data?.[ 0 ]?.data?.length ) {
			// For empty data, set domain [0, 1] to ensure 0 appears at bottom
			return [ 0, 1 ];
		}

		const maxValue = Math.max( ...data[ 0 ].data.map( item => item.value ) );
		// Add 10% padding for better visualization when there's data
		return [ 0, Math.max( 1, maxValue * 1.1 ) ];
	}, [ data, isEmpty ] );

	const renderTooltip = useCallback(
		( {
			tooltipData,
		}: {
			tooltipData?: {
				nearestDatum?: {
					datum: DataPointDate;
					key: string;
				};
				datumByKey?: { [ key: string ]: { datum: DataPointDate } };
			};
		} ) => {
			return <StatsChartTooltip tooltipData={ tooltipData } metricIcon={ metricIcon } />;
		},
		[ metricIcon ]
	);

	return (
		<div
			className={ styles[ 'chart-container' ] }
			onClick={ onClick }
			role="button"
			tabIndex={ 0 }
			onKeyDown={ onKeyDown }
		>
			{ isEmpty && (
				<div className={ styles[ 'chart-empty' ] }>
					<div
						className={ styles[ 'empty-state-card' ] }
						title={ __( 'No data in this period', 'jetpack-my-jetpack' ) }
					>
						<Icon className={ styles[ 'empty-state-card__icon' ] } icon={ info } size={ 32 } />
						<div className={ styles[ 'empty-state-card__content' ] }>
							<div className={ styles[ 'empty-state-card-heading' ] }>
								{ __( 'No data in this period', 'jetpack-my-jetpack' ) }
							</div>
							<div className={ styles[ 'empty-state-card-info' ] }>
								{ __(
									'There was no data recorded during this time period.',
									'jetpack-my-jetpack'
								) }
							</div>
						</div>
					</div>
				</div>
			) }

			{ isLoading && (
				<div className={ styles[ 'chart-loader' ] }>
					<LoadingBlock height="190px" width="100%" />
				</div>
			) }

			{ ! isLoading && (
				<Suspense
					fallback={
						<div className={ styles[ 'chart-loader' ] }>
							<LoadingBlock height="190px" width="100%" />
						</div>
					}
				>
					<BarChart
						data={ data }
						height={ 200 }
						withTooltips={ true }
						showLegend={ false }
						gridVisibility="x"
						margin={ { top: 10, right: 25, bottom: 20, left: 0 } }
						renderTooltip={ renderTooltip }
						options={ {
							yScale: {
								type: 'linear',
								zero: true, // Start from zero
								domain: yDomain, // Explicit domain to fix 0-guideline position
							},
							axis: {
								x: {
									// hideZero: false,
									numTicks: 7,
									tickFormat: timestamp => {
										const date = new Date( timestamp );

										return date.toLocaleDateString( undefined, {
											month: 'short',
											day: 'numeric',
										} );
									},
								},
								y: {
									orientation: 'right',
									tickFormat: value => {
										// Only show labels for integer values to avoid duplicates
										return Number.isInteger( value ) ? value.toString() : '';
									},
								},
							},
						} }
					/>
				</Suspense>
			) }
		</div>
	);
};

export default StatsChart;
