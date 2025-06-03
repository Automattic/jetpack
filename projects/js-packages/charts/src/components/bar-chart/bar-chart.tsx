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
	orientation?: 'horizontal' | 'vertical';
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
	gridVisibility: gridVisibilityProp,
	renderTooltip,
	options = {},
	orientation = 'vertical',
} ) => {
	const horizontal = orientation === 'horizontal';
	const gridVisibility = gridVisibilityProp ?? ( horizontal ? 'y' : 'x' );
	const theme = useXYChartTheme( data );
	const chartOptions = useMemo( () => {
		const bandScale = {
			type: 'band' as const,
			padding: 0.2,
			innerPadding: 0.1,
		};
		const linearScale = {
			type: 'linear' as const,
			nice: true,
			zero: false,
		};

		const defaultXTickFormat = getDefaultXTickFormat( data?.[ 0 ]?.data );
		const defaultYTickFormat = formatNumberCompact as TickFormatter< unknown >;

		return {
			axis: {
				x: {
					orientation: 'bottom' as const,
					numTicks: 4,
					tickFormat: horizontal ? defaultYTickFormat : defaultXTickFormat,
					...options?.axis?.x,
				},
				y: {
					orientation: 'left' as const,
					numTicks: 4,
					tickFormat: horizontal ? defaultXTickFormat : defaultYTickFormat,
					...options?.axis?.y,
				},
			},
			xScale: {
				...( horizontal ? linearScale : bandScale ),
				...options?.xScale,
			},
			yScale: {
				...( horizontal ? bandScale : linearScale ),
				...options?.yScale,
			},
		};
	}, [ options, data, horizontal ] );

	const defaultMargin = useChartMargin( height, chartOptions, data, theme, horizontal );

	const dateTickFormatter = horizontal
		? chartOptions.axis.y.tickFormat
		: chartOptions.axis.x.tickFormat;

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
							{ nearestDatum.label || dateTickFormatter( nearestDatum.date.getTime(), 0, [] ) }:
						</span>
						<span className={ styles[ 'bar-chart__tooltip-value' ] }>{ nearestDatum.value }</span>
					</div>
				</div>
			);
		},
		[ dateTickFormatter ]
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

				<AnimatedBarGroup
					padding={
						horizontal
							? ( chartOptions.yScale as { innerPadding: number } ).innerPadding
							: ( chartOptions.xScale as { innerPadding: number } ).innerPadding
					}
				>
					{ data.map( seriesData => {
						return (
							<AnimatedBarSeries
								key={ seriesData?.label }
								dataKey={ seriesData?.label }
								data={ seriesData.data as DataPointDate[] }
								yAccessor={ horizontal ? accessors.xAccessor : accessors.yAccessor }
								xAccessor={ horizontal ? accessors.yAccessor : accessors.xAccessor }
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
