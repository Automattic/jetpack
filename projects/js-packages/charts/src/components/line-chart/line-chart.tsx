import { LinearGradient } from '@visx/gradient';
import {
	XYChart,
	AnimatedLineSeries,
	AnimatedAreaSeries,
	AnimatedAxis,
	AnimatedGrid,
	Tooltip,
	buildChartTheme,
} from '@visx/xychart';
import clsx from 'clsx';
import { FC } from 'react';
import { useChartTheme } from '../../providers/theme/theme-provider';
import { Legend } from '../legend';
import { withResponsive } from '../shared/with-responsive';
import styles from './line-chart.module.scss';
import type { BaseChartProps, DataPointDate, SeriesData } from '../../types';

interface LineChartProps extends BaseChartProps< SeriesData[] > {
	margin?: { top: number; right: number; bottom: number; left: number };
	withGradientFill: boolean;
}

type TooltipData = {
	date: Date;
	[ key: string ]: number | Date;
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
	withGradientFill = false,
	options = {},
} ) => {
	const providerTheme = useChartTheme();

	if ( ! data?.length ) {
		return (
			<div className={ clsx( 'line-chart-empty', styles[ 'line-chart-empty' ] ) }>Empty...</div>
		);
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

	const theme = buildChartTheme( {
		backgroundColor: providerTheme.backgroundColor,
		colors: providerTheme.colors,
		gridStyles: providerTheme.gridStyles,
		tickLength: providerTheme?.tickLength || 0,
		gridColor: providerTheme?.gridColor || '',
		gridColorDark: providerTheme?.gridColorDark || '',
	} );

	return (
		<div className={ clsx( 'line-chart', styles[ 'line-chart' ], className ) }>
			<XYChart
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
							<LinearGradient
								id={ `area-gradient-${ index + 1 }` }
								from={ stroke }
								to="white"
								toOpacity={ 0.1 }
								{ ...seriesData.options?.gradient }
							/>
							<AnimatedLineSeries
								key={ seriesData?.label }
								dataKey={ seriesData?.label }
								data={ seriesData.data as DataPointDate[] } // TODO: this needs fixing or a more specific type for each chart
								{ ...accessors }
								stroke={ stroke }
								strokeWidth={ 2 }
							/>
							{ /** Theoretically the area series should work without the line series; however it outlines the area with borders, which isn't ideal. */ }
							{ /** TODO: Investigate whehter we could leverage area series alone. */ }
							{ withGradientFill && (
								<AnimatedAreaSeries
									key={ seriesData?.label }
									dataKey={ seriesData?.label }
									data={ seriesData.data as DataPointDate[] } // TODO: this needs fixing or a more specific type for each chart
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
					<Tooltip
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
