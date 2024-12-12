import { AxisLeft, AxisBottom } from '@visx/axis';
import { localPoint } from '@visx/event';
import { Group } from '@visx/group';
import { scaleBand, scaleLinear } from '@visx/scale';
import { Bar } from '@visx/shape';
import clsx from 'clsx';
import { FC, useCallback, useState } from 'react';
import { useChartTheme } from '../../providers/theme';
import { BaseTooltip } from '../tooltip';
import styles from './bar-chart.module.scss';
import type { DataPoint } from '../shared/types';

type BarChartProps = {
	/**
	 * Array of data points to display in the chart
	 */
	data: DataPoint[];
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
	margin?: {
		top?: number;
		right?: number;
		bottom?: number;
		left?: number;
	};
	/**
	 * Whether to show tooltips on hover
	 */
	showTooltips?: boolean;
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

const BarChart: FC< BarChartProps > = ( {
	data,
	width,
	height,
	margin = { top: 20, right: 20, bottom: 40, left: 40 },
	showTooltips = false,
} ) => {
	const [ tooltip, setTooltip ] = useState< TooltipState >( {
		visible: false,
		top: 0,
		left: 0,
		data: { label: '', value: 0 },
	} );

	const theme = useChartTheme();
	const margins = margin;
	const xMax = width - margins.left - margins.right;
	const yMax = height - margins.top - margins.bottom;

	const xScale = scaleBand< string >( {
		range: [ 0, xMax ],
		domain: data.map( d => d.label ),
		padding: 0.2,
	} );

	const yScale = scaleLinear< number >( {
		range: [ yMax, 0 ],
		domain: [ 0, Math.max( ...data.map( d => d.value ) ) ],
	} );

	const handleMouseMove = useCallback(
		( event: React.MouseEvent< SVGRectElement >, d: DataPoint ) => {
			if ( ! showTooltips ) return;
			const coords = localPoint( event );
			if ( ! coords ) return;

			setTooltip( {
				visible: true,
				top: coords.y - 10,
				left: coords.x,
				data: {
					label: d.label,
					value: d.value,
				},
			} );
		},
		[ showTooltips ]
	);

	const handleMouseLeave = useCallback( () => {
		setTooltip( prev => ( { ...prev, visible: false } ) );
	}, [] );

	const handleBarMouseMove = useCallback(
		( d: DataPoint ) => ( event: React.MouseEvent< SVGRectElement > ) => {
			handleMouseMove( event, d );
		},
		[ handleMouseMove ]
	);

	return (
		<div className={ clsx( 'bar-chart', styles[ 'bar-chart' ] ) }>
			<svg width={ width } height={ height }>
				<Group left={ margins.left } top={ margins.top }>
					{ data.map( d => (
						<Bar
							key={ `bar-${ d.label }` }
							x={ xScale( d.label ) }
							y={ yScale( d.value ) }
							width={ xScale.bandwidth() }
							height={ yMax - ( yScale( d.value ) ?? 0 ) }
							fill={ theme.colors[ 0 ] }
							onMouseMove={ handleBarMouseMove( d ) }
							onMouseLeave={ handleMouseLeave }
						/>
					) ) }
					<AxisLeft scale={ yScale } />
					<AxisBottom scale={ xScale } top={ yMax } />
				</Group>
			</svg>

			{ showTooltips && tooltip.visible && (
				<BaseTooltip data={ tooltip.data } top={ tooltip.top } left={ tooltip.left } />
			) }
		</div>
	);
};

BarChart.displayName = 'BarChart';

export default BarChart;
