import {
	XYChart,
	AnimatedLineSeries,
	AnimatedAxis,
	AnimatedGrid,
	Tooltip,
	buildChartTheme,
} from '@visx/xychart';
import clsx from 'clsx';
import { FC } from 'react';
import { useChartTheme } from '../../providers/theme/theme-provider';
import styles from './line-chart.module.scss';
import type { BaseChartProps, DataPointDate, SeriesData } from '../shared/types';

// TODO: revisit grid and axis options - accept as props for frid lines, axis, values: x, y, all, none

interface LineChartProps extends BaseChartProps< SeriesData[] > {
	/**
	 * Data series to display in the chart
	 */
	data: SeriesData[];
}

type TooltipData = {
	date: Date;
	[ key: string ]: number | Date;
};

const renderTooltip = ( {
	tooltipData,
}: {
	tooltipData?: { nearestDatum?: { datum: TooltipData } };
} ) => {
	const datum = tooltipData?.nearestDatum?.datum;
	if ( ! datum ) return null;

	return (
		<div className={ styles[ 'line-chart__tooltip' ] }>
			<div className={ styles[ 'line-chart__tooltip-row' ] }>
				<strong>Date:</strong> { datum.date.toLocaleDateString() }
			</div>
			{ Object.entries( datum ).map( ( [ key, value ] ) => {
				if ( key === 'date' ) return null;
				return (
					<div key={ key } className={ styles[ 'line-chart__tooltip-row' ] }>
						<span>
							<strong>{ key }:</strong> { value.toString() }
						</span>
					</div>
				);
			} ) }
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
	margin = { top: 20, right: 20, bottom: 40, left: 40 },
} ) => {
	const providerTheme = useChartTheme();

	if ( ! data.length ) {
		return (
			<div className={ clsx( 'line-chart-empty', styles[ 'line-chart-empty' ] ) }>Empty...</div>
		);
	}

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
		<div className={ clsx( 'line-chart', styles[ 'line-chart' ] ) }>
			<XYChart
				theme={ theme }
				width={ width }
				height={ height }
				margin={ margin }
				xScale={ { type: 'time' } }
				yScale={ { type: 'linear', nice: true } }
			>
				<AnimatedGrid columns={ false } numTicks={ 4 } />
				<AnimatedAxis orientation="bottom" numTicks={ 5 } tickFormat={ formatDateTick } />
				<AnimatedAxis orientation="left" numTicks={ 4 } />

				{ data.map( ( seriesData, index ) => (
					<AnimatedLineSeries
						key={ seriesData?.label }
						dataKey={ seriesData?.label }
						data={ seriesData.data }
						{ ...accessors }
						stroke={ theme.colors[ index % theme.colors.length ] }
						strokeWidth={ 2 }
					/>
				) ) }

				<Tooltip
					snapTooltipToDatumX
					snapTooltipToDatumY
					showSeriesGlyphs
					renderTooltip={ renderTooltip }
				/>
			</XYChart>
		</div>
	);
};

export default LineChart;
