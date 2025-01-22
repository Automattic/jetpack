import { curveNatural } from '@visx/curve';
import { LinearGradient } from '@visx/gradient';
import {
	XYChart,
	AnimatedAreaSeries,
	AnimatedAxis,
	AnimatedGrid,
	Tooltip,
	buildChartTheme,
} from '@visx/xychart';
import clsx from 'clsx';
import { FC, useMemo } from 'react';
import { useChartTheme } from '../../providers/theme/theme-provider';
import { Legend } from '../legend';
import { withResponsive } from '../shared/with-responsive';
import styles from './line-chart.module.scss';
import type { BaseChartProps, DataPointDate, SeriesData } from '../../types';

interface LineChartProps extends BaseChartProps< SeriesData[] > {
	margin?: { top: number; right: number; bottom: number; left: number };
	withGradientFill?: boolean;
}

type TooltipData = DataPointDate & {
	[ key: string ]: number | Date | string;
};

type TooltipDatum = {
	key: string;
	value: number;
};

const renderTooltip = ( {
	tooltipData,
}: {
	tooltipData?: {
		nearestDatum?: {
			datum: TooltipData;
			key: string;
		};
		datumByKey?: { [ key: string ]: { datum: TooltipData } };
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
				{ nearestDatum.date.toLocaleDateString() }
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

// Validation functions
const isValidDate = ( date: Date ) => ! isNaN( date.getTime() );
const isValidValue = ( value: number | null | undefined ): value is number =>
	typeof value === 'number' && ! isNaN( value );

const validateData = ( data: SeriesData[] ) => {
	if ( ! data?.length ) {
		return 'no data available';
	}

	for ( const series of data ) {
		if ( ! series.data?.length ) {
			return 'invalid data';
		}

		for ( const point of series.data ) {
			if (
				! ( 'date' in point ) ||
				! isValidDate( point.date as Date ) ||
				! isValidValue( point.value )
			) {
				return 'invalid data';
			}
		}
	}

	return null;
};

const formatDateTick = ( value: number ) => {
	const date = new Date( value );
	return date.toLocaleDateString( undefined, {
		month: 'short',
		day: 'numeric',
	} );
};

const LineChart: FC< LineChartProps > = ( {
	data,
	width,
	height,
	className,
	margin = {},
	withTooltips = true,
	showLegend = false,
	legendOrientation = 'horizontal',
	withGradientFill = true,
	options = {},
} ) => {
	const providerTheme = useChartTheme();
	const error = validateData( data );

	if ( error ) {
		return <div className={ clsx( styles[ 'line-chart' ], className ) }>{ error }</div>;
	}

	// Create legend items from group labels, this iterates over groups rather than data points
	const legendItems = data.map( ( group, index ) => ( {
		label: group.label, // Label for each unique group
		value: '', // Empty string since we don't want to show a specific value
		color: providerTheme.colors[ index % providerTheme.colors.length ],
	} ) );

	const accessors = {
		xAccessor: ( d: DataPointDate ) => d.date,
		yAccessor: ( d: DataPointDate ) => d.value,
	};

	return (
		<div className={ clsx( styles[ 'line-chart' ], className ) }>
			{ showLegend && (
				<Legend
					items={ legendItems }
					orientation={ legendOrientation }
					className={ styles[ 'line-chart__legend' ] }
				/>
			) }
			<XYChart
				data-testid="line-chart-svg"
				theme={ theme }
				width={ width }
				height={ height }
				margin={ { top: 20, right: 20, bottom: 40, left: 40, ...margin } }
				xScale={ { type: 'time', ...options?.xScale } }
				yScale={ { type: 'linear', nice: true, zero: false, ...options?.yScale } }
			>
				<AnimatedGrid columns={ false } numTicks={ 4 } />
				<AnimatedAxis
					orientation="bottom"
					numTicks={ 5 }
					tickFormat={ formatDateTick }
					{ ...options?.axis?.x }
				/>
				<AnimatedAxis orientation="left" numTicks={ 4 } { ...options?.axis?.y } />

				{ data.map( ( seriesData, index ) => {
					const stroke = seriesData.options?.stroke ?? theme.colors[ index % theme.colors.length ];
					return (
						<>
							{ withGradientFill && (
								<LinearGradient
									data-testid="line-gradient"
									id={ `area-gradient-${ index + 1 }` }
									from={ stroke }
									to="white"
									toOpacity={ 0.1 }
									{ ...seriesData.options?.gradient }
								/>
							) }
							<AnimatedLineSeries
								key={ seriesData?.label }
								dataKey={ seriesData?.label }
								data={ seriesData.data as DataPointDate[] }
								{ ...accessors }
								stroke={ stroke }
								strokeWidth={ 2 }
							/>
							{ withGradientFill && (
								<AnimatedAreaSeries
									key={ `${ seriesData?.label }-area` }
									dataKey={ `${ seriesData?.label }-area` }
									data={ seriesData.data as DataPointDate[] }
									{ ...accessors }
									stroke={ stroke }
									strokeWidth={ 0 }
									fill={ `url(#area-gradient-${ index + 1 })` }
									renderLine={ false }
								/>
							) }
						</>
					);
				} ) }

				{ withTooltips && (
					<Tooltip< DataPointDate >
						snapTooltipToDatumX
						snapTooltipToDatumY
						showVerticalCrosshair
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

export default withResponsive( LineChart );
