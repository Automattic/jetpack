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
import styles from './line-chart.module.scss';
import type { DataPointDate } from '../shared/types';

// TODO: revisit grid and axis options - accept as props for frid lines, axis, values: x, y, all, none

type LineChartProps = {
	/**
	 * Array of data points to display in the chart
	 */
	data: DataPointDate[];
	/**
	 * Width of the chart in pixels
	 */
	width: number;
	/**
	 * Height of the chart in pixels
	 */
	height: number;
	/**
	 * Chart margins
	 */
	margin?: { top: number; right: number; bottom: number; left: number };
	/**
	 * Color of the line
	 */
	lineColor?: string;
};

// TODO: move to a provider
// const customTheme = buildChartTheme( {
// 	// Customize colors
// 	colors: [ '#3182ce' ],
// 	// Customize typography
// 	// labelStyles: {
// 	// 	fill: '#666',
// 	// 	fontSize: 12,
// 	// },
// 	// Customize grid styles
// 	gridStyles: {
// 		stroke: '#e2e8f0',
// 		strokeWidth: 1,
// 	},
// } );

const customTheme = buildChartTheme( {
	// colors
	backgroundColor: 'lightblue', // used by Tooltip, Annotation
	colors: [ '#3182ce' ], // categorical colors, mapped to series via `dataKey`s

	// labels
	//   svgLabelBig?: SVGTextProps,
	//   svgLabelSmall?: SVGTextProps,
	//   htmlLabel?: HTMLTextStyles,

	// lines
	//   xAxisLineStyles?: LineStyles,
	//   yAxisLineStyles?: LineStyles,
	//   xTickLineStyles?: LineStyles,
	//   yTickLineStyles?: LineStyles,
	//   tickLength: number,

	// grid
	//   gridColor: string,
	//   gridColorDark: string, // used for axis baseline if x/yxAxisLineStyles not set
	//   gridStyles?: CSSProperties,
	gridStyles: {
		stroke: '#e2e8f0',
		strokeWidth: 1,
	},
	tickLength: 0,
	gridColor: '',
	gridColorDark: '',
} );

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
	lineColor = '#3182ce',
} ) => {
	const accessors = {
		xAccessor: ( d: DataPointDate ) => d.date,
		yAccessor: ( d: DataPointDate ) => d.value,
	};

	//
	return (
		<div className={ clsx( 'line-chart', styles[ 'line-chart' ] ) }>
			<XYChart
				theme={ customTheme }
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
					stroke={ lineColor }
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
