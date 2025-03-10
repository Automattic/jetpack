import { curveCatmullRom, curveLinear } from '@visx/curve';
import { LinearGradient } from '@visx/gradient';
import {
	XYChart,
	AnimatedAreaSeries,
	AnimatedAxis,
	AnimatedGrid,
	Tooltip,
	buildChartTheme,
} from '@visx/xychart';
import { RenderTooltipParams } from '@visx/xychart/lib/components/Tooltip';
import clsx from 'clsx';
import { FC, ReactNode, useId, useMemo } from 'react';
import { useChartTheme } from '../../providers/theme/theme-provider';
import { Legend } from '../legend';
import { withResponsive } from '../shared/with-responsive';
import styles from './line-chart.module.scss';
import type { BaseChartProps, DataPointDate, SeriesData } from '../../types';

const X_TICK_WIDTH = 100;

interface LineChartProps extends BaseChartProps< SeriesData[] > {
	withGradientFill: boolean;
	smoothing?: boolean;
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
	renderTooltip = renderDefaultTooltip,
	options = {},
	onPointerDown = undefined,
	onPointerUp = undefined,
	onPointerMove = undefined,
	onPointerOut = undefined,
} ) => {
	const providerTheme = useChartTheme();
	const chartId = useId(); // Ensure unique ids for gradient fill.

	const dataSorted = useMemo(
		() =>
			data.map( series => ( {
				...series,
				data: series.data.sort( ( a, b ) => a.date.getTime() - b.date.getTime() ),
			} ) ),
		[ data ]
	);

	const theme = useMemo( () => {
		const seriesColors =
			dataSorted?.map( series => series.options?.stroke ?? '' ).filter( Boolean ) ?? [];
		return buildChartTheme( {
			...providerTheme,
			colors: [ ...seriesColors, ...providerTheme.colors ],
		} );
	}, [ providerTheme, dataSorted ] );

	margin = useMemo( () => {
		// Auto-margin unless specified to make room for axis labels.
		// Default margin is for bottom and left axis labels.
		let defaultMargin = {};
		if ( options.axis?.y?.orientation === 'right' ) {
			defaultMargin = { ...defaultMargin, right: 40, left: 0 };
		}
		if ( options.axis?.x?.orientation === 'top' ) {
			defaultMargin = { ...defaultMargin, top: 20, bottom: 10 };
		}
		// Merge default margin with user-specified margin.
		return { ...defaultMargin, ...margin };
	}, [ margin, options ] );

	const xNumTicks = useMemo(
		() => Math.min( dataSorted[ 0 ]?.data.length, Math.ceil( width / X_TICK_WIDTH ) ),
		[ dataSorted, width ]
	);

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
				margin={ { top: 10, right: 0, bottom: 20, left: 40, ...margin } }
				// xScale and yScale could be set in Axis as well, but they are `scale` props there.
				xScale={ { type: 'time', ...options?.xScale } }
				yScale={ { type: 'linear', nice: true, zero: false, ...options?.yScale } }
				onPointerDown={ onPointerDown }
				onPointerUp={ onPointerUp }
				onPointerMove={ onPointerMove }
				onPointerOut={ onPointerOut }
				pointerEventsDataKey="nearest"
			>
				<AnimatedGrid columns={ false } numTicks={ 4 } />
				<AnimatedAxis
					orientation="bottom"
					numTicks={ xNumTicks }
					tickFormat={ formatDateTick }
					{ ...options?.axis?.x }
				/>
				<AnimatedAxis orientation="left" numTicks={ 4 } { ...options?.axis?.y } />

				{ dataSorted.map( ( seriesData, index ) => {
					const stroke = seriesData.options?.stroke ?? theme.colors[ index % theme.colors.length ];
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
								curve={ smoothing ? curveCatmullRom : curveLinear }
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
