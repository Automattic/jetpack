import { formatNumber } from '@automattic/number-formatters';
import { PatternLines, PatternCircles, PatternWaves, PatternHexagons } from '@visx/pattern';
import { Axis, BarSeries, BarGroup, Grid, XYChart } from '@visx/xychart';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useCallback, useContext, useState, useRef, useMemo } from 'react';
import { Legend, useChartLegendItems } from '../../components/legend';
import { AccessibleTooltip, useKeyboardNavigation } from '../../components/tooltip';
import {
	useXYChartTheme,
	useChartDataTransform,
	useZeroValueDisplay,
	useChartMargin,
	usePrefersReducedMotion,
} from '../../hooks';
import {
	GlobalChartsProvider,
	useChartId,
	useChartRegistration,
	useGlobalChartsContext,
	GlobalChartsContext,
} from '../../providers';
import { attachSubComponents } from '../../utils';
import { useChartChildren } from '../private/chart-composition';
import { ChartLayout } from '../private/chart-layout';
import { SingleChartContext } from '../private/single-chart-context';
import { SvgEmptyState } from '../private/svg-empty-state';
import { withResponsive } from '../private/with-responsive';
import styles from './bar-chart.module.scss';
import { useBarChartOptions } from './private';
import type { BaseChartProps, DataPointDate, SeriesData, Optional } from '../../types';
import type { RenderTooltipParams } from '../../visx/types';
import type { ResponsiveConfig } from '../private/with-responsive';
import type { FC, ReactNode, ComponentType } from 'react';

export interface BarChartProps extends BaseChartProps< SeriesData[] > {
	renderTooltip?: ( params: RenderTooltipParams< DataPointDate > ) => ReactNode;
	orientation?: 'horizontal' | 'vertical';
	withPatterns?: boolean;
	showZeroValues?: boolean;
	children?: ReactNode;
}

// Base props type with optional responsive properties
type BarChartBaseProps = Optional< BarChartProps, 'width' | 'height' | 'size' >;

// Composition API types
interface BarChartSubComponents {
	Legend: ComponentType< React.ComponentProps< typeof Legend > >;
}

type BarChartComponent = FC< BarChartBaseProps > & BarChartSubComponents;
type BarChartResponsiveComponent = FC< BarChartBaseProps & ResponsiveConfig > &
	BarChartSubComponents;

// Validation function similar to LineChart
const validateData = ( data: SeriesData[] ) => {
	if ( ! data?.length ) return 'No data available';

	const hasInvalidData = data.some( series =>
		series.data.some(
			point =>
				isNaN( point.value as number ) ||
				point.value === null ||
				point.value === undefined ||
				( ! point.label &&
					( ! ( 'date' in point && point.date ) || isNaN( point.date.getTime() ) ) )
		)
	);

	if ( hasInvalidData ) return 'Invalid data';
	return null;
};

const getPatternId = ( chartId: string, index: number ) => `bar-pattern-${ chartId }-${ index }`;

const BarChartInternal: FC< BarChartProps > = ( {
	data,
	chartId: providedChartId,
	width,
	height,
	className,
	margin,
	withTooltips = false,
	showLegend = false,
	legend = {},
	gridVisibility: gridVisibilityProp,
	renderTooltip,
	options = {},
	orientation = 'vertical',
	withPatterns = false,
	showZeroValues = false,
	animation,
	children,
	gap = 'md',
} ) => {
	const legendInteractive = legend.interactive ?? false;
	const horizontal = orientation === 'horizontal';
	const chartId = useChartId( providedChartId );
	const theme = useXYChartTheme( data );

	const dataSorted = useChartDataTransform( data );

	// Transform data to add a small value for zero bars to make them visible
	// For vertical bars, height determines bar pixel height; for horizontal bars, width does
	const dataWithVisibleZeros = useZeroValueDisplay( dataSorted, {
		enabled: showZeroValues,
		valueAxisLength: horizontal ? width : height,
	} );

	// Create legend items using the reusable hook
	const legendItems = useChartLegendItems( dataSorted );
	const chartOptions = useBarChartOptions( dataWithVisibleZeros, horizontal, options );
	const defaultMargin = useChartMargin( height, chartOptions, dataSorted, theme, horizontal );
	const chartRef = useRef< HTMLDivElement >( null );

	// Process children for composition API (Legend, etc.)
	const { legendChildren, nonLegendChildren } = useChartChildren( children, 'BarChart' );
	const [ measuredChartHeight, setMeasuredChartHeight ] = useState< number | undefined >();

	const handleContentHeightChange = useCallback(
		( contentHeight: number ) => {
			const chartHeight = contentHeight > 0 ? contentHeight : height;
			setMeasuredChartHeight( chartHeight );
		},
		[ height ]
	);
	const [ selectedIndex, setSelectedIndex ] = useState< number | undefined >( undefined );
	const [ isNavigating, setIsNavigating ] = useState( false );

	const totalPoints =
		Math.max( 0, ...data.map( series => series.data?.length || 0 ) ) * data.length;

	// Use the keyboard navigation hook
	const { tooltipRef, onChartFocus, onChartBlur, onChartKeyDown } = useKeyboardNavigation( {
		selectedIndex,
		setSelectedIndex,
		isNavigating,
		setIsNavigating,
		chartRef,
		totalPoints,
	} );

	const { getElementStyles, isSeriesVisible } = useGlobalChartsContext();

	// Add visibility information to series when using interactive legends
	const seriesWithVisibility = useMemo( () => {
		if ( ! chartId || ! legendInteractive ) {
			return dataWithVisibleZeros.map( ( series, index ) => ( {
				series,
				index,
				isVisible: true,
			} ) );
		}
		return dataWithVisibleZeros.map( ( series, index ) => ( {
			series,
			index,
			isVisible: isSeriesVisible( chartId, series.label ),
		} ) );
	}, [ dataWithVisibleZeros, chartId, isSeriesVisible, legendInteractive ] );

	// Check if all series are hidden
	const allSeriesHidden = useMemo( () => {
		return seriesWithVisibility.every( ( { isVisible } ) => ! isVisible );
	}, [ seriesWithVisibility ] );

	const getBarBackground = useCallback(
		( index: number ) => () =>
			withPatterns
				? `url(#${ getPatternId( chartId, index ) })`
				: getElementStyles( { data: dataSorted[ index ], index } ).color,
		[ withPatterns, getElementStyles, dataSorted, chartId ]
	);

	const renderDefaultTooltip = useCallback(
		( { tooltipData }: RenderTooltipParams< DataPointDate > ) => {
			const nearestDatum = tooltipData?.nearestDatum?.datum;
			if ( ! nearestDatum ) return null;

			return (
				<div className={ styles[ 'bar-chart__tooltip' ] }>
					<div className={ styles[ 'bar-chart__tooltip-header' ] }>
						{ tooltipData?.nearestDatum?.key }
					</div>
					<div className={ styles[ 'bar-chart__tooltip-row' ] }>
						<span className={ styles[ 'bar-chart__tooltip-label' ] }>
							{ chartOptions.tooltip.labelFormatter(
								nearestDatum.label || ( nearestDatum.date ? nearestDatum.date.getTime() : 0 ),
								0,
								[]
							) }
							:
						</span>
						<span className={ styles[ 'bar-chart__tooltip-value' ] }>
							{ formatNumber( nearestDatum.value as number ) }
						</span>
					</div>
				</div>
			);
		},
		[ chartOptions.tooltip ]
	);

	const renderPattern = useCallback(
		( index: number, color: string ) => {
			const patternType = index % 4;
			const id = getPatternId( chartId, index );
			const commonProps = {
				id,
				stroke: 'white',
				strokeWidth: 1,
				background: color,
			};

			switch ( patternType ) {
				case 0:
				default:
					return (
						<PatternLines
							key={ id }
							{ ...commonProps }
							width={ 5 }
							height={ 5 }
							orientation={ [ 'diagonal' ] }
						/>
					);
				case 1:
					return (
						<PatternCircles key={ id } { ...commonProps } width={ 6 } height={ 6 } fill="white" />
					);
				case 2:
					return <PatternWaves key={ id } { ...commonProps } width={ 4 } height={ 4 } />;
				case 3:
					return <PatternHexagons key={ id } { ...commonProps } size={ 8 } height={ 3 } />;
			}
		},
		[ chartId ]
	);

	const createPatternBorderStyle = useCallback(
		( index: number, color: string ) => {
			const patternId = getPatternId( chartId, index );
			return `
			.visx-bar[fill="url(#${ patternId })"] {
				stroke: ${ color };
				stroke-width: 1;
				}
			`;
		},
		[ chartId ]
	);

	const createKeyboardHighlightStyle = useCallback( () => {
		if ( selectedIndex === undefined ) return '';

		// Calculate which bar should be highlighted based on selectedIndex
		// Pattern: [series1[0], series2[0], series3[0], series1[1], series2[1], series3[1], ...]
		const maxDataPoints = Math.max( ...data.map( s => s.data.length ) );
		const dataPointIndex = Math.floor( selectedIndex / data.length );
		const seriesIndex = selectedIndex % data.length;

		// Only highlight if we're within valid bounds
		if ( dataPointIndex >= maxDataPoints || seriesIndex >= data.length ) {
			return '';
		}

		const seriesData = data[ seriesIndex ];
		if ( dataPointIndex >= seriesData.data.length ) {
			return '';
		}

		// Based on the DOM structure analysis:
		// - All bars are in a single .visx-bar-group
		// - Bars are ordered as: [series1[0], series1[1], series2[0], series2[1], ...]
		// - So we need to calculate the actual bar index in the DOM
		const actualBarIndex = seriesIndex * maxDataPoints + dataPointIndex;

		// Use a CSS class selector instead of ID since useId() generates invalid CSS ID characters
		const generatedStyles = `
			.bar-chart[data-chart-id="bar-chart-${ chartId }"] .visx-bar-group .visx-bar:nth-child(${
				actualBarIndex + 1
			}) {
				stroke: #005fcc;
				stroke-width: 2px;
			}
		`;

		return generatedStyles;
	}, [ selectedIndex, data, chartId ] );

	// Validate data first
	const error = validateData( dataSorted );
	const isDataValid = ! error;

	// Memoize metadata to prevent unnecessary re-registration
	const chartMetadata = useMemo(
		() => ( {
			orientation,
			withPatterns,
		} ),
		[ orientation, withPatterns ]
	);

	// Register chart with context only if data is valid
	useChartRegistration( {
		chartId,
		legendItems,
		chartType: 'bar',
		isDataValid,
		metadata: chartMetadata,
	} );

	const prefersReducedMotion = usePrefersReducedMotion();

	if ( error ) {
		return <div className={ clsx( 'bar-chart', styles[ 'bar-chart' ] ) }>{ error }</div>;
	}

	const gridVisibility = gridVisibilityProp ?? chartOptions.gridVisibility;
	const highlightedBarStyle = createKeyboardHighlightStyle();

	const legendPosition = legend.position ?? 'bottom';
	const legendElement = showLegend && (
		<Legend
			orientation={ legend.orientation ?? 'horizontal' }
			position={ legendPosition }
			alignment={ legend.alignment ?? 'center' }
			labelStyles={ legend.labelStyles }
			itemClassName={ legend.itemClassName }
			itemStyles={ legend.itemStyles }
			shapeStyles={ legend.shapeStyles }
			className={ styles[ 'bar-chart__legend' ] }
			shape={ legend.shape ?? 'rect' }
			chartId={ chartId }
			interactive={ legendInteractive }
		/>
	);

	return (
		<SingleChartContext.Provider
			value={ {
				chartId,
				chartWidth: width,
				chartHeight: measuredChartHeight || 0,
			} }
		>
			<ChartLayout
				legendPosition={ legendPosition }
				legendElement={ legendElement }
				legendChildren={ legendChildren }
				gap={ gap }
				className={ clsx(
					'bar-chart',
					styles[ 'bar-chart' ],
					{
						[ styles[ `bar-chart--animated${ horizontal ? '-horizontal' : '' }` ] ]:
							animation && ! prefersReducedMotion,
					},
					className
				) }
				style={ { width, height } }
				data-testid="bar-chart"
				data-chart-id={ `bar-chart-${ chartId }` }
				trailingContent={ nonLegendChildren }
				onContentHeightChange={ handleContentHeightChange }
			>
				{ ( { contentHeight } ) => {
					const chartHeight = contentHeight > 0 ? contentHeight : height;

					return (
						<div
							role="grid"
							aria-label={ __( 'Bar chart', 'jetpack-charts' ) }
							tabIndex={ 0 }
							onKeyDown={ onChartKeyDown }
							onFocus={ onChartFocus }
							onBlur={ onChartBlur }
						>
							{ chartHeight > 0 && (
								<div ref={ chartRef }>
									<XYChart
										theme={ theme }
										width={ width }
										height={ chartHeight }
										margin={ {
											...defaultMargin,
											...margin,
										} }
										xScale={ chartOptions.xScale }
										yScale={ chartOptions.yScale }
										horizontal={ horizontal }
										pointerEventsDataKey="nearest"
									>
										<Grid
											columns={ gridVisibility.includes( 'y' ) }
											rows={ gridVisibility.includes( 'x' ) }
											numTicks={ 4 }
										/>

										{ withPatterns && (
											<>
												<defs data-testid="bar-chart-patterns">
													{ dataSorted.map( ( seriesData, index ) =>
														renderPattern(
															index,
															getElementStyles( { data: seriesData, index } ).color
														)
													) }
												</defs>
												<style>
													{ dataSorted.map( ( seriesData, index ) =>
														createPatternBorderStyle(
															index,
															getElementStyles( { data: seriesData, index } ).color
														)
													) }
												</style>
											</>
										) }

										{ highlightedBarStyle && <style>{ highlightedBarStyle }</style> }

										{ allSeriesHidden ? (
											<SvgEmptyState
												x={ width / 2 }
												y={ chartHeight / 2 }
												width={ width }
												height={ chartHeight }
											>
												{ __(
													'All series are hidden. Click legend items to show data.',
													'jetpack-charts'
												) }
											</SvgEmptyState>
										) : null }

										<BarGroup padding={ chartOptions.barGroup.padding }>
											{ seriesWithVisibility.map( ( { series: seriesData, index, isVisible } ) => {
												// Skip rendering invisible series
												if ( ! isVisible ) {
													return null;
												}

												return (
													<BarSeries
														key={ seriesData?.label }
														dataKey={ seriesData?.label }
														data={ seriesData.data as DataPointDate[] }
														yAccessor={ chartOptions.accessors.yAccessor }
														xAccessor={ chartOptions.accessors.xAccessor }
														colorAccessor={ getBarBackground( index ) }
													/>
												);
											} ) }
										</BarGroup>

										<Axis { ...chartOptions.axis.x } />
										<Axis { ...chartOptions.axis.y } />

										{ withTooltips && (
											<AccessibleTooltip
												detectBounds
												snapTooltipToDatumX
												snapTooltipToDatumY
												renderTooltip={ renderTooltip || renderDefaultTooltip }
												selectedIndex={ selectedIndex }
												tooltipRef={ tooltipRef }
												keyboardFocusedClassName={
													styles[ 'bar-chart__tooltip--keyboard-focused' ]
												}
												series={ data }
												mode="individual"
											/>
										) }
									</XYChart>
								</div>
							) }
						</div>
					);
				} }
			</ChartLayout>
		</SingleChartContext.Provider>
	);
};

const BarChartWithProvider: FC< BarChartProps > = props => {
	const existingContext = useContext( GlobalChartsContext );

	// If we're already in a GlobalChartsProvider context, don't create a new one
	if ( existingContext ) {
		return <BarChartInternal { ...props } />;
	}

	// Otherwise, create our own GlobalChartsProvider
	return (
		<GlobalChartsProvider>
			<BarChartInternal { ...props } />
		</GlobalChartsProvider>
	);
};

BarChartWithProvider.displayName = 'BarChart';

// Create BarChart with composition API
const BarChart = attachSubComponents( BarChartWithProvider, {
	Legend: Legend,
} ) as BarChartComponent;

// Create responsive BarChart with composition API
const BarChartResponsive = attachSubComponents(
	withResponsive< BarChartProps >( BarChartWithProvider ),
	{
		Legend: Legend,
	}
) as BarChartResponsiveComponent;

export { BarChartResponsive as default, BarChart as BarChartUnresponsive };
