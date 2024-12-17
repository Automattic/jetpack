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
import type { BaseChartProps, DataPointDate } from '../shared/types';

// TODO: revisit grid and axis options - accept as props for frid lines, axis, values: x, y, all, none

interface LineChartProps extends BaseChartProps< DataPointDate[] > {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderTooltip: any = ( { tooltipData } ) => {
	// TODO: fix any
	const datum = tooltipData?.nearestDatum?.datum;
	if ( ! datum ) {
		return null;
	}

	return (
		<div className={ styles[ 'line-chart__tooltip' ] }>
			<div className={ styles[ 'line-chart__tooltip-row' ] }>
				<strong>Date:</strong> { datum.date.toLocaleDateString() }
			</div>
			<div className={ styles[ 'line-chart__tooltip-row' ] }>
				<strong>Value:</strong> { datum.value }
			</div>
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

// TODO: add support for multiple data sets

const LineChart: FC< LineChartProps > = ( {
	data,
	width,
	height,
	margin = { top: 20, right: 20, bottom: 40, left: 40 },
} ) => {
	const providerTheme = useChartTheme();
	const accessors = {
		xAccessor: ( d: DataPointDate ) => d.date,
		yAccessor: ( d: DataPointDate ) => d.value,
	};

	// Use theme to construct XYChart theme
	const chartTheme = {
		backgroundColor: providerTheme.backgroundColor,
		colors: providerTheme.colors,
		gridStyles: providerTheme.gridStyles,
		tickLength: providerTheme?.tickLength || 0,
		gridColor: providerTheme?.gridColor || '',
		gridColorDark: providerTheme?.gridColorDark || '',
	};

	const theme = buildChartTheme( chartTheme );

	//
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

				<AnimatedLineSeries
					dataKey="Line"
					data={ data }
					{ ...accessors }
					stroke={ theme.colors[ 0 ] }
					strokeWidth={ 2 }
				/>

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
