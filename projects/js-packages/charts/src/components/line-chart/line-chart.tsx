import { formatNumberCompact } from '@automattic/number-formatters';
import { curveCatmullRom, curveLinear, curveMonotoneX } from '@visx/curve';
import { LinearGradient } from '@visx/gradient';
import { XYChart, AnimatedAreaSeries, AnimatedAxis, AnimatedGrid, Tooltip } from '@visx/xychart';
import clsx from 'clsx';
import { FC, ReactNode, useId, useMemo } from 'react';
import { useXYChartTheme, useChartTheme } from '../../providers/theme/theme-provider';
import { Legend } from '../legend';
import { useChartMargin } from '../shared/use-chart-margin';
import { withResponsive } from '../shared/with-responsive';
import styles from './line-chart.module.scss';
import type { BaseChartProps, DataPointDate, SeriesData } from '../../types';
import type { TickFormatter } from '@visx/axis';
import type { RenderTooltipParams } from '@visx/xychart/lib/components/Tooltip';

type CurveType = 'smooth' | 'linear' | 'monotone';

const X_TICK_WIDTH = 100;

/**
 * Determines the curve type for the line chart based on the provided type and smoothing parameters
 *
 * @param {CurveType} type      - The explicit curve type to use
 * @param {boolean}   smoothing - Legacy smoothing parameter
 * @return The curve function to use for the line
 */
const getCurveType = ( type?: CurveType, smoothing?: boolean ) => {
	// If no type specified, use legacy smoothing behavior
	if ( ! type ) {
		return smoothing ? curveCatmullRom : curveLinear;
	}

	// Handle explicit curve types
	switch ( type ) {
		case 'smooth':
			return curveCatmullRom;
		case 'monotone':
			return curveMonotoneX;
		case 'linear':
			return curveLinear;
		default:
			return curveLinear;
	}
};

interface LineChartProps extends BaseChartProps< SeriesData[] > {
	withGradientFill: boolean;
	smoothing?: boolean;
	curveType?: CurveType;
	renderTooltip?: ( params: RenderTooltipParams< DataPointDate > ) => ReactNode;
}

type TooltipDatum = {
	key: string;
	value: number;
};

const renderDefaultTooltip = ( {
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
	const nearestDatum = tooltipData?.nearestDatum?.datum;
	if ( ! nearestDatum ) return null;

	const tooltipPoints: TooltipDatum[] = Object.entries( tooltipData?.datumByKey || {} )
		.map( ( [ key, { datum } ] ) => ( {
			key,
			value: datum.value as number,
		} ) )
		.sort( ( a, b ) => b.value - a.value );

	return (
		<div className={ styles[ 'line-chart__tooltip' ] }>
			<div className={ styles[ 'line-chart__tooltip-date' ] }>
				{ nearestDatum.date?.toLocaleDateString() }
			</div>
			{ tooltipPoints.map( point => (
				<div key={ point.key } className={ styles[ 'line-chart__tooltip-row' ] }>
					<span className={ styles[ 'line-chart__tooltip-label' ] }>{ point.key }:</span>
					<span className={ styles[ 'line-chart__tooltip-value' ] }>{ point.value }</span>
				</div>
			) ) }
		</div>
	);
};

const formatDateTick = ( timestamp: number ) => {
	const date = new Date( timestamp );
	return date.toLocaleDateString( undefined, {
		month: 'short',
		day: 'numeric',
	} );
};

const validateData = ( data: SeriesData[] ) => {
	if ( ! data?.length ) return 'No data available';

	const hasInvalidData = data.some( series =>
		series.data.some(
			point =>
				isNaN( point.value as number ) ||
				point.value === null ||
				point.value === undefined ||
				isNaN( point.date.getTime() )
		)
	);

	if ( hasInvalidData ) return 'Invalid data';
	return null;
};

const LineChart: FC< LineChartProps > = ( {
	data,
	width,
	height,
	className,
	margin,
	withTooltips = true,
	showLegend = false,
	legendOrientation = 'horizontal',
	withGradientFill = false,
	smoothing = true,
	curveType = 'linear',
	renderTooltip = renderDefaultTooltip,
	options = {},
	onPointerDown = undefined,
	onPointerUp = undefined,
	onPointerMove = undefined,
	onPointerOut = undefined,
} ) => {
	const providerTheme = useChartTheme();
	const theme = useXYChartTheme( data );
	const chartId = useId(); // Ensure unique ids for gradient fill.

	const dataSorted = useMemo(
		() =>
			data.map( series => ( {
				...series,
				data: series.data.sort( ( a, b ) => a.date.getTime() - b.date.getTime() ),
			} ) ),
		[ data ]
	);

	const chartOptions = useMemo( () => {
		const xNumTicks = Math.min( dataSorted[ 0 ]?.data.length, Math.ceil( width / X_TICK_WIDTH ) );
		return {
			axis: {
				x: {
					orientation: 'bottom' as const,
					numTicks: xNumTicks,
					tickFormat: formatDateTick,
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
				type: 'time' as const,
				...options?.xScale,
			},
			yScale: {
				type: 'linear' as const,
				nice: true,
				zero: false,
				...options?.yScale,
			},
		};
	}, [ options, dataSorted, width ] );

	const defaultMargin = useChartMargin( height, chartOptions, dataSorted, theme );

	const error = validateData( dataSorted );
	if ( error ) {
		return <div className={ clsx( 'line-chart', styles[ 'line-chart' ] ) }>{ error }</div>;
	}

	// Create legend items from group labels, this iterates over groups rather than data points
	const legendItems = dataSorted.map( ( group, index ) => ( {
		label: group.label, // Label for each unique group
		value: '', // Empty string since we don't want to show a specific value
		color: providerTheme.colors[ index % providerTheme.colors.length ],
	} ) );

	const accessors = {
		xAccessor: ( d: DataPointDate ) => d?.date,
		yAccessor: ( d: DataPointDate ) => d?.value,
	};

	return (
		<div
			className={ clsx( 'line-chart', styles[ 'line-chart' ], className ) }
			data-testid="line-chart"
			role="img"
			aria-label="line chart"
		>
			<XYChart
				theme={ theme }
				width={ width }
				height={ height }
				margin={ { ...defaultMargin, ...margin } }
				// xScale and yScale could be set in Axis as well, but they are `scale` props there.
				xScale={ chartOptions.xScale }
				yScale={ chartOptions.yScale }
				onPointerDown={ onPointerDown }
				onPointerUp={ onPointerUp }
				onPointerMove={ onPointerMove }
				onPointerOut={ onPointerOut }
				pointerEventsDataKey="nearest"
			>
				<AnimatedGrid columns={ false } numTicks={ 4 } />
				<AnimatedAxis { ...chartOptions.axis.x } />
				<AnimatedAxis { ...chartOptions.axis.y } />

				{ dataSorted.map( ( seriesData, index ) => {
					const stroke = seriesData.options?.stroke ?? theme.colors[ index % theme.colors.length ];
					const lineProps =
						providerTheme?.seriesLineStyles?.[ index % providerTheme.seriesLineStyles.length ] ||
						{};
					return (
						<g key={ seriesData?.label || index }>
							{ withGradientFill && (
								<LinearGradient
									id={ `area-gradient-${ chartId }-${ index + 1 }` }
									from={ stroke }
									fromOpacity={ 0.4 }
									toOpacity={ 0.1 }
									to={ theme.backgroundColor }
									{ ...seriesData.options?.gradient }
									data-testid="line-gradient"
								/>
							) }
							<AnimatedAreaSeries
								key={ seriesData?.label }
								dataKey={ seriesData?.label }
								data={ seriesData.data as DataPointDate[] }
								{ ...accessors }
								fill={
									withGradientFill ? `url(#area-gradient-${ chartId }-${ index + 1 })` : undefined
								}
								renderLine={ true }
								curve={ getCurveType( curveType, smoothing ) }
								lineProps={ lineProps }
							/>
						</g>
					);
				} ) }

				{ withTooltips && (
					<Tooltip
						detectBounds
						snapTooltipToDatumX
						snapTooltipToDatumY
						showSeriesGlyphs
						renderTooltip={ renderTooltip }
					/>
				) }
			</XYChart>

			{ showLegend && (
				<Legend
					items={ legendItems }
					orientation={ legendOrientation }
					className={ styles[ 'line-chart-legend' ] }
				/>
			) }
		</div>
	);
};

export default withResponsive< LineChartProps >( LineChart );
