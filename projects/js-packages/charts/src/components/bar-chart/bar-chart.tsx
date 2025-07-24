import { PatternLines, PatternCircles, PatternWaves, PatternHexagons } from '@visx/pattern';
import { Axis, BarSeries, BarGroup, Grid, XYChart } from '@visx/xychart';
import clsx from 'clsx';
import { useCallback, useId, useState, useRef, useMemo } from 'react';
import { ChartProvider, useChartId, useChartRegistration } from '../../providers/chart-context';
import { useChartTheme, useXYChartTheme } from '../../providers/theme';
import { Legend } from '../legend';
import { useChartDataTransform } from '../shared/use-chart-data-transform';
import { useChartMargin } from '../shared/use-chart-margin';
import { useElementHeight } from '../shared/use-element-height';
import { withResponsive } from '../shared/with-responsive';
import { AccessibleTooltip, useKeyboardNavigation } from '../tooltip/accessible-tooltip';
import styles from './bar-chart.module.scss';
import { useBarChartOptions } from './use-bar-chart-options';
import type { BaseChartProps, DataPointDate, SeriesData } from '../../types';
import type { RenderTooltipParams } from '@visx/xychart/lib/components/Tooltip';
import type { FC, ReactNode } from 'react';

type BarChartDataPoint = DataPointDate & {
	__originalValue?: number;
	__isZero?: boolean;
};

export interface BarChartProps extends BaseChartProps< SeriesData[] > {
	renderTooltip?: ( params: RenderTooltipParams< DataPointDate > ) => ReactNode;
	orientation?: 'horizontal' | 'vertical';
	withPatterns?: boolean;
	zeroValueDisplay?: boolean;
}

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
	height = 400,
	className,
	margin,
	withTooltips = false,
	showLegend = false,
	legendOrientation = 'horizontal',
	legendAlignmentHorizontal = 'center',
	legendAlignmentVertical = 'bottom',
	legendShape = 'rect',
	gridVisibility: gridVisibilityProp,
	renderTooltip,
	options = {},
	orientation = 'vertical',
	withPatterns = false,
	zeroValueDisplay = false,
} ) => {
	const horizontal = orientation === 'horizontal';
	// Generate a unique chart ID to avoid pattern conflicts with multiple charts
	const internalChartId = useId();
	const chartId = useChartId( providedChartId );
	const theme = useXYChartTheme( data );

	const dataSorted = useChartDataTransform( data );

	// Transform data to add a small value for zero bars to make them visible
	// We'll store the original value for tooltips and calculations
	const dataWithVisibleZeros = useMemo( () => {
		if ( zeroValueDisplay === false ) return dataSorted;

		// Calculate the scale range to determine appropriate minimum bar value
		const allValues = dataSorted.flatMap( series =>
			series.data.map( d => d.value as number ).filter( v => v > 0 )
		);

		if ( allValues.length === 0 ) return dataSorted;

		// Calculate a small visible value for zero bars that adapts to the data range:
		// - Use 60% of minimum value when data range is wide (prevents zero bars from being too small)
		// - Use 0.8% of maximum value when data range is narrow (prevents zero bars from being too large)
		// This ensures zero bars are always visible but never misleadingly prominent
		const minVisibleValue = Math.min(
			Math.min( ...allValues ) * 0.6,
			Math.max( ...allValues ) * 0.008
		);

		return dataSorted.map( series => ( {
			...series,
			data: series.data.map( point => ( {
				...point,
				__originalValue: point.value, // Store original value
				__isZero: point.value === 0,
				value: point.value === 0 ? minVisibleValue : point.value,
			} ) ),
		} ) );
	}, [ dataSorted, zeroValueDisplay ] );

	const chartOptions = useBarChartOptions( dataWithVisibleZeros, horizontal, options );
	const defaultMargin = useChartMargin(
		height,
		chartOptions,
		dataWithVisibleZeros,
		theme,
		horizontal
	);
	const [ legendRef, legendHeight ] = useElementHeight< HTMLDivElement >();
	const chartRef = useRef< HTMLDivElement >( null );
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

	const getColor = useCallback(
		( seriesData: SeriesData, index: number ) =>
			seriesData?.options?.stroke || theme.colors[ index % theme.colors.length ],
		[ theme ]
	);

	const getBarBackground = useCallback(
		( index: number ) => () =>
			withPatterns
				? `url(#${ getPatternId( internalChartId, index ) })`
				: getColor( dataWithVisibleZeros[ index ], index ),
		[ withPatterns, getColor, dataWithVisibleZeros, internalChartId ]
	);

	const renderDefaultTooltip = useCallback(
		( { tooltipData }: RenderTooltipParams< DataPointDate > ) => {
			const nearestDatum = tooltipData?.nearestDatum?.datum as BarChartDataPoint;
			if ( ! nearestDatum ) return null;

			// Use the original value if available, otherwise use the actual value
			const displayValue =
				nearestDatum.__originalValue !== undefined
					? nearestDatum.__originalValue
					: nearestDatum.value;

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
						<span className={ styles[ 'bar-chart__tooltip-value' ] }>{ displayValue }</span>
					</div>
				</div>
			);
		},
		[ chartOptions.tooltip ]
	);

	const renderPattern = useCallback(
		( index: number, color: string ) => {
			const patternType = index % 4;
			const id = getPatternId( internalChartId, index );
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
		[ internalChartId ]
	);

	const createPatternBorderStyle = useCallback(
		( index: number, color: string ) => {
			const patternId = getPatternId( internalChartId, index );
			return `
			.visx-bar[fill="url(#${ patternId })"] {
				stroke: ${ color };
				stroke-width: 1;
				}
			`;
		},
		[ internalChartId ]
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

	// Create legend items (hooks must be called in same order every render)
	const legendItems = useMemo(
		() =>
			dataSorted.map( ( group, index ) => ( {
				label: group.label, // Label for each unique group
				value: '', // Empty string since we don't want to show a specific value
				color: getColor( group, index ),
				shapeStyle: group?.options?.legendShapeStyle,
			} ) ),
		[ dataSorted, getColor ]
	);

	// Register chart with context only if data is valid
	const providerTheme = useChartTheme();
	useChartRegistration( chartId, legendItems, providerTheme, 'bar', isDataValid, {
		orientation,
		withPatterns,
	} );

	if ( error ) {
		return <div className={ clsx( 'bar-chart', styles[ 'bar-chart' ] ) }>{ error }</div>;
	}

	const gridVisibility = gridVisibilityProp ?? chartOptions.gridVisibility;
	const highlightedBarStyle = createKeyboardHighlightStyle();

	return (
		<div
			className={ clsx( 'bar-chart', styles[ 'bar-chart' ], className ) }
			data-testid="bar-chart"
			role="grid"
			aria-label="bar chart"
			style={ {
				width,
				height,
				display: 'flex',
				flexDirection:
					showLegend && legendAlignmentVertical === 'top' ? 'column-reverse' : 'column',
			} }
			tabIndex={ 0 }
			onKeyDown={ onChartKeyDown }
			onFocus={ onChartFocus }
			onBlur={ onChartBlur }
			ref={ chartRef }
			data-chart-id={ `bar-chart-${ chartId }` } // Unique ID for the chart
		>
			{ highlightedBarStyle && <style>{ highlightedBarStyle }</style> }

			<XYChart
				theme={ theme }
				width={ width }
				height={ height - ( showLegend ? legendHeight : 0 ) }
				margin={ {
					...defaultMargin,
					...margin,
					...( showLegend && legendAlignmentVertical === 'top'
						? { top: ( defaultMargin.top || 0 ) + legendHeight }
						: {} ),
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
							{ dataWithVisibleZeros.map( ( seriesData, index ) =>
								renderPattern( index, getColor( seriesData, index ) )
							) }
						</defs>
						<style>
							{ dataWithVisibleZeros.map( ( seriesData, index ) =>
								createPatternBorderStyle( index, getColor( seriesData, index ) )
							) }
						</style>
					</>
				) }

				<BarGroup padding={ chartOptions.barGroup.padding }>
					{ dataWithVisibleZeros.map( ( seriesData, index ) => (
						<BarSeries
							key={ seriesData?.label }
							dataKey={ seriesData?.label }
							data={ seriesData.data as DataPointDate[] }
							yAccessor={ chartOptions.accessors.yAccessor }
							xAccessor={ chartOptions.accessors.xAccessor }
							colorAccessor={ getBarBackground( index ) }
						/>
					) ) }
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
						keyboardFocusedClassName={ styles[ 'bar-chart__tooltip--keyboard-focused' ] }
						series={ data }
						mode="individual"
					/>
				) }
			</XYChart>

			{ showLegend && (
				<Legend
					items={ legendItems }
					orientation={ legendOrientation }
					alignmentHorizontal={ legendAlignmentHorizontal }
					alignmentVertical={ legendAlignmentVertical }
					className={ styles[ 'bar-chart__legend' ] }
					shape={ legendShape }
					ref={ legendRef }
				/>
			) }
		</div>
	);
};

const BarChart: FC< BarChartProps > = props => (
	<ChartProvider>
		<BarChartInternal { ...props } />
	</ChartProvider>
);

BarChart.displayName = 'BarChart';

export default withResponsive< BarChartProps >( BarChart );
