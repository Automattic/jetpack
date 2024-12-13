import { AxisLeft, AxisBottom } from '@visx/axis';
import { localPoint } from '@visx/event';
import { Group } from '@visx/group';
import { scaleBand, scaleLinear } from '@visx/scale';
import { Bar } from '@visx/shape';
import { useTooltip } from '@visx/tooltip';
import clsx from 'clsx';
import { FC, useCallback } from 'react';
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

const BarChart: FC< BarChartProps > = ( {
	data,
	width,
	height,
	margin = { top: 20, right: 20, bottom: 40, left: 40 },
	showTooltips = false,
} ) => {
	const theme = useChartTheme();
	const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData, hideTooltip, showTooltip } =
		useTooltip< DataPoint >();

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
		( event: React.MouseEvent, datum: DataPoint ) => {
			const coords = localPoint( event );
			if ( ! coords ) return;

			showTooltip( {
				tooltipData: datum,
				tooltipLeft: coords.x,
				tooltipTop: coords.y - 10,
			} );
		},
		[ showTooltip ]
	);

	const handleMouseLeave = useCallback( () => {
		hideTooltip();
	}, [ hideTooltip ] );

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

			{ showTooltips && tooltipOpen && tooltipData && (
				<BaseTooltip
					data={ {
						label: tooltipData.label,
						value: tooltipData.value,
					} }
					top={ tooltipTop }
					left={ tooltipLeft }
				/>
			) }
		</div>
	);
};

BarChart.displayName = 'BarChart';

export default BarChart;
