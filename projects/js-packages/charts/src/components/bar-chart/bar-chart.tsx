import { formatNumberCompact } from '@automattic/number-formatters';
import {
	AnimatedAxis,
	AnimatedBarSeries,
	AnimatedBarGroup,
	AnimatedGrid,
	Tooltip,
	XYChart,
} from '@visx/xychart';
import { RenderTooltipParams } from '@visx/xychart/lib/components/Tooltip';
import clsx from 'clsx';
import { FC, ReactNode, useCallback, useMemo } from 'react';
import { useXYChartTheme } from '../../providers/theme';
import { Legend } from '../legend';
import { useChartMargin } from '../shared/use-chart-margin';
import { withResponsive } from '../shared/with-responsive';
import styles from './bar-chart.module.scss';
import type { BaseChartProps, DataPointDate, SeriesData } from '../../types';
import type { TickFormatter } from '@visx/axis';

interface BarChartProps extends BaseChartProps< SeriesData[] > {
	renderTooltip?: ( params: RenderTooltipParams< DataPointDate > ) => ReactNode;
}

const formatDateTick = ( timestamp: number ) => {
	const date = new Date( timestamp );
	return date.toLocaleDateString( undefined, {
		month: 'short',
		day: 'numeric',
	} );
};

const getDefaultXTickFormat = ( data: SeriesData[ 'data' ] ) => {
	if ( data?.[ 0 ]?.label ) {
		return ( label: string ) => label;
	}

	return formatDateTick;
};

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

const accessors = {
	xAccessor: ( d: DataPointDate ) => d?.label || d?.date,
	yAccessor: ( d: DataPointDate ) => d?.value,
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
	gridVisibility = 'x',
	renderTooltip,
	options = {},
} ) => {
	const theme = useXYChartTheme( data );
	const chartOptions = useMemo( () => {
		return {
			axis: {
				x: {
					orientation: 'bottom' as const,
					numTicks: 4,
					tickFormat: getDefaultXTickFormat( data?.[ 0 ]?.data ),
					...options?.axis?.x,
				},
				y: {
					orientation: 'left' as const,
					numTicks: 4,
					tickFormat: formatNumberCompact as TickFormatter< number >,
					...options?.axis?.y,
				},
			},
			xScale: {
				type: 'band' as const,
				padding: 0.2,
				innerPadding: 0.1,
				...options?.xScale,
			},
			yScale: {
				type: 'linear' as const,
				nice: true,
				zero: false,
				...options?.yScale,
			},
		};
	}, [ options, data ] );

	const defaultMargin = useChartMargin( height, chartOptions, data, theme );

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
							{ nearestDatum.label ||
								chartOptions.axis.x.tickFormat( nearestDatum.date.getTime(), 0, [] ) }
							:
						</span>
						<span className={ styles[ 'bar-chart__tooltip-value' ] }>{ nearestDatum.value }</span>
					</div>
				</div>
			);
		},
		[ chartOptions.axis.x ]
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
				pointerEventsDataKey="nearest"
			>
				<AnimatedGrid
					columns={ gridVisibility.includes( 'y' ) }
					rows={ gridVisibility.includes( 'x' ) }
					numTicks={ 4 }
				/>
				<AnimatedAxis { ...chartOptions.axis.x } />
				<AnimatedAxis { ...chartOptions.axis.y } />

				<AnimatedBarGroup padding={ 0.1 }>
					{ data.map( seriesData => {
						return (
							<AnimatedBarSeries
								key={ seriesData?.label }
								dataKey={ seriesData?.label }
								data={ seriesData.data as DataPointDate[] }
								{ ...accessors }
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
