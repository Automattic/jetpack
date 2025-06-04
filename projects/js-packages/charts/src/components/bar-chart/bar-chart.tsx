import {
	AnimatedAxis,
	AnimatedBarSeries,
	AnimatedBarGroup,
	AnimatedGrid,
	Tooltip,
	XYChart,
} from '@visx/xychart';
import clsx from 'clsx';
import { useCallback } from 'react';
import { useXYChartTheme } from '../../providers/theme';
import { Legend } from '../legend';
import { useChartMargin } from '../shared/use-chart-margin';
import { withResponsive } from '../shared/with-responsive';
import styles from './bar-chart.module.scss';
import { useBarChartOptions } from './use-bar-chart-options';
import type { BaseChartProps, DataPointDate, SeriesData } from '../../types';
import type { RenderTooltipParams } from '@visx/xychart/lib/components/Tooltip';
import type { FC, ReactNode } from 'react';

export interface BarChartProps extends BaseChartProps< SeriesData[] > {
	renderTooltip?: ( params: RenderTooltipParams< DataPointDate > ) => ReactNode;
	orientation?: 'horizontal' | 'vertical';
}

// Validation function similar to LineChart
const validateData = ( data: SeriesData[] ) => {
	if ( ! data?.length ) return 'No data available';

	const hasInvalidData = data.some( series =>
		series.data.some(
			d =>
				d.value === null ||
				d.value === undefined ||
				isNaN( d.value ) ||
				( ! d.label && ( ! d.date || isNaN( d.date.getTime() ) ) )
		)
	);

	if ( hasInvalidData ) return 'Invalid data';
	return null;
};

const BarChart: FC< BarChartProps > = ( {
	data,
	width,
	height = 400,
	className,
	margin,
	withTooltips = false,
	showLegend = false,
	legendOrientation = 'horizontal',
	gridVisibility: gridVisibilityProp,
	renderTooltip,
	options = {},
	orientation = 'vertical',
} ) => {
	const horizontal = orientation === 'horizontal';

	const theme = useXYChartTheme( data );
	const chartOptions = useBarChartOptions( data, horizontal, options );
	const defaultMargin = useChartMargin( height, chartOptions, data, theme, horizontal );

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
								nearestDatum.label || nearestDatum.date.getTime(),
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

	// Validate data using the same pattern as LineChart
	const error = validateData( data );
	if ( error ) {
		return <div className={ clsx( 'bar-chart', styles[ 'bar-chart' ] ) }>{ error }</div>;
	}

	// Create legend items from group labels, this iterates over groups rather than data points
	const legendItems = data.map( ( group, index ) => ( {
		label: group.label, // Label for each unique group
		value: '', // Empty string since we don't want to show a specific value
		color: group.options?.stroke || theme.colors[ index % theme.colors.length ],
	} ) );

	const gridVisibility = gridVisibilityProp ?? chartOptions.gridVisibility;

	return (
		<div
			className={ clsx( 'bar-chart', styles[ 'bar-chart' ], className ) }
			data-testid="bar-chart"
			role="img"
			aria-label="bar chart"
		>
			<XYChart
				theme={ theme }
				width={ width }
				height={ height }
				margin={ { ...defaultMargin, ...margin } }
				xScale={ chartOptions.xScale }
				yScale={ chartOptions.yScale }
				horizontal={ horizontal }
				pointerEventsDataKey="nearest"
			>
				<AnimatedGrid
					columns={ gridVisibility.includes( 'y' ) }
					rows={ gridVisibility.includes( 'x' ) }
					numTicks={ 4 }
				/>
				<AnimatedAxis { ...chartOptions.axis.x } />
				<AnimatedAxis { ...chartOptions.axis.y } />

				<AnimatedBarGroup padding={ chartOptions.barGroup.padding }>
					{ data.map( seriesData => {
						return (
							<AnimatedBarSeries
								key={ seriesData?.label }
								dataKey={ seriesData?.label }
								data={ seriesData.data as DataPointDate[] }
								yAccessor={ chartOptions.accessors.yAccessor }
								xAccessor={ chartOptions.accessors.xAccessor }
							/>
						);
					} ) }
				</AnimatedBarGroup>

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
					className={ styles[ 'bar-chart__legend' ] }
				/>
			) }
		</div>
	);
};

export default withResponsive< BarChartProps >( BarChart );
