import { localPoint } from '@visx/event';
import {
	XYChart,
	AnimatedLineSeries,
	AnimatedAxis,
	AnimatedGrid,
	buildChartTheme,
	EventHandlerParams,
} from '@visx/xychart';
import clsx from 'clsx';
import { FC, useState, useCallback } from 'react';
import { useChartTheme } from '../../providers/theme/theme-provider';
import { BaseTooltip } from '../tooltip/base-tooltip';
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
	/**
	 * Whether to show tooltips on hover
	 */
	showTooltip?: boolean;
};

type TooltipState = {
	visible: boolean;
	top: number;
	left: number;
	data: {
		label: string;
		value: number;
	};
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
	showTooltip = false,
} ) => {
	const [ tooltip, setTooltip ] = useState< TooltipState >( {
		visible: false,
		top: 0,
		left: 0,
		data: { label: '', value: 0 },
	} );

	const providerTheme = useChartTheme();
	const accessors = {
		xAccessor: ( d: DataPointDate ) => d.date,
		yAccessor: ( d: DataPointDate ) => d.value,
	};

	const chartTheme = {
		backgroundColor: providerTheme.backgroundColor,
		colors: providerTheme.colors,
		gridStyles: providerTheme.gridStyles,
		tickLength: providerTheme?.tickLength || 0,
		gridColor: providerTheme?.gridColor || '',
		gridColorDark: providerTheme?.gridColorDark || '',
	};

	const theme = buildChartTheme( chartTheme );

	const handlePointerMove = useCallback( ( params: EventHandlerParams< DataPointDate > ) => {
		const { datum } = params;
		if ( datum ) {
			const coords = localPoint( params.event );
			if ( ! coords ) return;

			setTooltip( {
				visible: true,
				top: coords.y - 10,
				left: coords.x,
				data: {
					label: datum.date.toLocaleDateString(),
					value: datum.value,
				},
			} );
		}
	}, [] );

	const handlePointerLeave = useCallback( () => {
		setTooltip( prev => ( { ...prev, visible: false } ) );
	}, [] );

	return (
		<div className={ clsx( 'line-chart', styles[ 'line-chart' ] ) }>
			<XYChart
				theme={ theme }
				width={ width }
				height={ height }
				margin={ margin }
				xScale={ { type: 'time' } }
				yScale={ { type: 'linear', nice: true } }
				onPointerMove={ handlePointerMove }
				onPointerOut={ handlePointerLeave }
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
			</XYChart>

			{ showTooltip && tooltip.visible && (
				<BaseTooltip data={ tooltip.data } top={ tooltip.top } left={ tooltip.left } />
			) }
		</div>
	);
};

export default LineChart;
