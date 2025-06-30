import { PatternLines, PatternCircles, PatternWaves, PatternHexagons } from '@visx/pattern';
import { Axis, BarSeries, BarGroup, Grid, Tooltip, XYChart } from '@visx/xychart';
import clsx from 'clsx';
import { useCallback, useId } from 'react';
import { useXYChartTheme } from '../../providers/theme';
import { Legend } from '../legend';
import { useChartDataTransform } from '../shared/use-chart-data-transform';
import { useChartMargin } from '../shared/use-chart-margin';
import { useElementHeight } from '../shared/use-element-height';
import { withResponsive } from '../shared/with-responsive';
import styles from './bar-chart.module.scss';
import { useBarChartOptions } from './use-bar-chart-options';
import type { BaseChartProps, DataPointDate, SeriesData } from '../../types';
import type { RenderTooltipParams } from '@visx/xychart/lib/components/Tooltip';
import type { FC, ReactNode } from 'react';

export interface BarChartProps extends BaseChartProps< SeriesData[] > {
	renderTooltip?: ( params: RenderTooltipParams< DataPointDate > ) => ReactNode;
	orientation?: 'horizontal' | 'vertical';
	withPatterns?: boolean;
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

const BarChart: FC< BarChartProps > = ( {
	data,
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
} ) => {
	const horizontal = orientation === 'horizontal';
	// Generate a unique chart ID to avoid pattern conflicts with multiple charts
	const chartId = useId();
	const theme = useXYChartTheme( data );

	const dataSorted = useChartDataTransform( data );

	const chartOptions = useBarChartOptions( dataSorted, horizontal, options );
	const defaultMargin = useChartMargin( height, chartOptions, dataSorted, theme, horizontal );
	const [ legendRef, legendHeight ] = useElementHeight< HTMLDivElement >();

	const getColor = useCallback(
		( seriesData: SeriesData, index: number ) =>
			seriesData?.options?.stroke || theme.colors[ index % theme.colors.length ],
		[ theme ]
	);

	const getBarBackground = useCallback(
		( index: number ) => () =>
			withPatterns
				? `url(#${ getPatternId( chartId, index ) })`
				: getColor( dataSorted[ index ], index ),
		[ withPatterns, getColor, dataSorted, chartId ]
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
						<span className={ styles[ 'bar-chart__tooltip-value' ] }>{ nearestDatum.value }</span>
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

	// Validate data using the same pattern as LineChart
	const error = validateData( dataSorted );
	if ( error ) {
		return <div className={ clsx( 'bar-chart', styles[ 'bar-chart' ] ) }>{ error }</div>;
	}

	// Create legend items from group labels, this iterates over groups rather than data points
	const legendItems = dataSorted.map( ( group, index ) => ( {
		label: group.label, // Label for each unique group
		value: '', // Empty string since we don't want to show a specific value
		color: getColor( group, index ),
		shapeStyle: group?.options?.legendShapeStyle,
	} ) );

	const gridVisibility = gridVisibilityProp ?? chartOptions.gridVisibility;

	return (
		<div
			className={ clsx( 'bar-chart', styles[ 'bar-chart' ], className ) }
			data-testid="bar-chart"
			role="img"
			aria-label="bar chart"
			style={ {
				width,
				height,
				display: 'flex',
				flexDirection:
					showLegend && legendAlignmentVertical === 'top' ? 'column-reverse' : 'column',
			} }
		>
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
							{ dataSorted.map( ( seriesData, index ) =>
								renderPattern( index, getColor( seriesData, index ) )
							) }
						</defs>
						<style>
							{ dataSorted.map( ( seriesData, index ) =>
								createPatternBorderStyle( index, getColor( seriesData, index ) )
							) }
						</style>
					</>
				) }

				<BarGroup padding={ chartOptions.barGroup.padding }>
					{ dataSorted.map( ( seriesData, index ) => (
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
					<Tooltip
						detectBounds
						snapTooltipToDatumX
						snapTooltipToDatumY
						renderTooltip={ renderTooltip || renderDefaultTooltip }
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

export default withResponsive< BarChartProps >( BarChart );
