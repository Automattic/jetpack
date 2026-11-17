import { BarChart, DataPointDate, LineChart } from '@automattic/charts';
import '@automattic/charts/style.css';
import { __ } from '@wordpress/i18n';
import { Icon, info } from '@wordpress/icons';
import { Link } from '@wordpress/ui';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import formatNumber from '../../utils/format-number';
import LoadingBlock from '../loading-block';
import StatsChartTooltip from './stats-chart-tooltip';
import styles from './stats-chart.module.scss';
import type { ReactElement, FC } from 'react';

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
	href?: string;
	onClick: () => void;
	selectedMetric: string;
	metricIcon?: ReactElement;
	fitTicks?: boolean;
	variant?: 'bar' | 'area';
}

// Below this width, seven date labels run into each other.
const NARROW_CHART_WIDTH = 360;

const formatDateTick = ( timestamp: number ) =>
	new Date( timestamp ).toLocaleDateString( undefined, { month: 'short', day: 'numeric' } );

// Only show labels for integer values to avoid duplicates.
const formatValueTick = ( value: number ) => ( Number.isInteger( value ) ? value.toString() : '' );
const formatCompactValueTick = ( value: number ) =>
	Number.isInteger( value ) ? formatNumber( value ) : '';

/**
 * Stats chart component with bar or area chart visualization.
 * @param {object}   props            - Component props.
 * @param {object}   props.data       - Chart data.
 * @param {boolean}  props.isLoading  - Whether the chart is loading.
 * @param {string}   props.href       - Destination of the detailed stats link.
 * @param {Function} props.onClick    - Click handler.
 * @param {object}   props.metricIcon - The icon JSX element for the selected metric.
 * @param {boolean}  [props.fitTicks] - Whether to show fewer date labels when the chart is narrow.
 * @param {string}   [props.variant]  - Whether to draw bars or a filled area.
 * @return {object} StatsChart React component.
 */
const StatsChart: FC< StatsChartProps > = ( {
	data,
	isLoading,
	href,
	onClick,
	metricIcon,
	fitTicks = false,
	variant = 'bar',
} ) => {
	const containerRef = useRef< HTMLAnchorElement >( null );
	const [ width, setWidth ] = useState( 0 );
	useEffect( () => {
		const container = containerRef.current;
		if ( ! fitTicks || ! container || typeof ResizeObserver === 'undefined' ) {
			return;
		}
		const observer = new ResizeObserver( ( [ entry ] ) => setWidth( entry.contentRect.width ) );
		observer.observe( container );
		return () => observer.disconnect();
	}, [ fitTicks ] );
	const isNarrow = width > 0 && width < NARROW_CHART_WIDTH;

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
		<Link
			ref={ containerRef }
			variant="unstyled"
			className={ styles[ 'chart-container' ] }
			href={ href }
			onClick={ href ? onClick : undefined }
			aria-label={ __( 'View detailed stats', 'jetpack-my-jetpack' ) }
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
					{ variant === 'area' ? (
						<LineChart
							data={ data }
							height={ 200 }
							withGradientFill
							// The default Catmull-Rom curve dips below 0 between a 0 day and a high one.
							curveType="monotone"
							withTooltips
							showLegend={ false }
							gridVisibility="y"
							renderTooltip={ renderTooltip }
							options={ {
								yScale: { type: 'linear', zero: true, domain: yDomain },
								axis: {
									x: { numTicks: isNarrow ? 4 : 7, tickFormat: formatDateTick },
									y: { tickFormat: formatCompactValueTick },
								},
							} }
						/>
					) : (
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
										numTicks: isNarrow ? 4 : 7,
										tickFormat: formatDateTick,
									},
									y: {
										orientation: 'right',
										tickFormat: formatValueTick,
									},
								},
							} }
						/>
					) }
				</Suspense>
			) }
		</Link>
	);
};

export default StatsChart;
