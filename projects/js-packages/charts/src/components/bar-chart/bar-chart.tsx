import { AxisLeft, AxisBottom } from '@visx/axis';
import { localPoint } from '@visx/event';
import { Group } from '@visx/group';
import { scaleBand, scaleLinear } from '@visx/scale';
import { Bar } from '@visx/shape';
import { useTooltip } from '@visx/tooltip';
import clsx from 'clsx';
import { FC, useCallback, type MouseEvent } from 'react';
import { useChartTheme } from '../../providers/theme';
import { Legend } from '../legend';
import { BaseTooltip } from '../tooltip';
import styles from './bar-chart.module.scss';
import type { BaseChartProps, DataPoint } from '../shared/types';

interface BarChartProps extends BaseChartProps {
	/**
	 * Array of data points to display in the chart
	 */
	data: DataPoint[];
	/**
	 * Label for the data series
	 */
	seriesLabel?: string;
}

const BarChart: FC< BarChartProps > = ( {
	data,
	width,
	height,
	margin = { top: 20, right: 20, bottom: 40, left: 40 },
	withTooltips = false,
	showLegend = false,
	legendOrientation = 'horizontal',
	className,
	seriesLabel,
} ) => {
	const theme = useChartTheme();
	const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData, hideTooltip, showTooltip } =
		useTooltip< DataPoint >();

	const margins = margin;
	const xMax = width - margins.left - margins.right;
	const yMax = height - margins.top - margins.bottom;

	// Create scales
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
		( event: MouseEvent< SVGRectElement >, datum: DataPoint ) => {
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

	const legendItems = [
		{
			label: seriesLabel,
			value: '', // Empty string since we don't want to show a specific value
			color: theme.colors[ 0 ],
		},
	];

	return (
		<div className={ clsx( 'bar-chart', className, styles[ 'bar-chart' ] ) }>
			<svg width={ width } height={ height }>
				<Group left={ margins.left } top={ margins.top }>
					{ data.map( d => {
						const handleBarMouseMove = event => handleMouseMove( event, d );

						return (
							<Bar
								key={ `bar-${ d.label }` }
								x={ xScale( d.label ) }
								y={ yScale( d.value ) }
								width={ xScale.bandwidth() }
								height={ yMax - ( yScale( d.value ) ?? 0 ) }
								fill={ theme.colors[ 0 ] }
								onMouseMove={ withTooltips ? handleBarMouseMove : undefined }
								onMouseLeave={ withTooltips ? handleMouseLeave : undefined }
							/>
						);
					} ) }
					<AxisLeft scale={ yScale } />
					<AxisBottom scale={ xScale } top={ yMax } />
				</Group>
			</svg>

			{ withTooltips && tooltipOpen && tooltipData && (
				<BaseTooltip
					data={ {
						label: tooltipData.label,
						value: tooltipData.value,
					} }
					top={ tooltipTop }
					left={ tooltipLeft }
				/>
			) }

			{ showLegend && (
				<Legend
					items={ legendItems }
					orientation={ legendOrientation }
					className={ styles[ 'bar-chart-legend' ] }
				/>
			) }
		</div>
	);
};

BarChart.displayName = 'BarChart';
export default BarChart;
