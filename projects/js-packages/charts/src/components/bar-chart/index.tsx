import { AxisLeft, AxisBottom } from '@visx/axis';
import { localPoint } from '@visx/event';
import { Group } from '@visx/group';
import { scaleBand, scaleLinear } from '@visx/scale';
import { Bar } from '@visx/shape';
import { useTooltip } from '@visx/tooltip';
import React from 'react';
import { Tooltip } from '../tooltip';
import type { DataPoint } from '../shared/types';

type BarChartProps = {
	data: DataPoint[];
	width: number;
	height: number;
	margin?: {
		[ K in 'top' | 'right' | 'bottom' | 'left' ]?: number;
	};
	showTooltips?: boolean;
};

/**
 * Renders a bar chart using the provided data.
 *
 * @param {BarChartProps} props - Component props
 * @return {JSX.Element} The rendered bar chart component
 */
function BarChart( { data, width, height, margin, showTooltips = false }: BarChartProps ) {
	const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData, hideTooltip, showTooltip } =
		useTooltip< DataPoint >();

	const margins = { top: 20, right: 20, bottom: 40, left: 40, ...margin };
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

	const handleMouseMove = React.useCallback(
		( event: React.MouseEvent< SVGRectElement >, datum: DataPoint ) => {
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

	const handleMouseLeave = React.useCallback( () => {
		hideTooltip();
	}, [ hideTooltip ] );

	const getMouseMoveHandler = React.useCallback(
		( d: DataPoint ) => {
			if ( ! showTooltips ) return undefined;
			return ( event: React.MouseEvent< SVGRectElement > ) => handleMouseMove( event, d );
		},
		[ showTooltips, handleMouseMove ]
	);

	return (
		<div style={ { position: 'relative' } }>
			<svg width={ width } height={ height }>
				<Group left={ margins.left } top={ margins.top }>
					{ data.map( d => (
						<Bar
							key={ `bar-${ d.label }` }
							x={ xScale( d.label ) }
							y={ yScale( d.value ) }
							width={ xScale.bandwidth() }
							height={ yMax - ( yScale( d.value ) ?? 0 ) }
							fill="#0675C4"
							onMouseMove={ getMouseMoveHandler( d ) }
							onMouseLeave={ showTooltips ? handleMouseLeave : undefined }
						/>
					) ) }
					<AxisLeft scale={ yScale } />
					<AxisBottom scale={ xScale } top={ yMax } />
				</Group>
			</svg>
			{ tooltipOpen && tooltipData && (
				<Tooltip
					data={ tooltipData }
					top={ tooltipTop }
					left={ tooltipLeft }
					style={ {
						transform: 'translate(-50%, -100%)',
					} }
				/>
			) }
		</div>
	);
}

export default BarChart;
