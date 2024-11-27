import { AxisLeft, AxisBottom } from '@visx/axis';
import { Group } from '@visx/group';
import { scaleBand, scaleLinear } from '@visx/scale';
import { Bar } from '@visx/shape';
import React from 'react';

export interface DataPoint {
	label: string;
	value: number;
}

interface BarChartProps {
	data: DataPoint[];
	width: number;
	height: number;
	margin?: { top: number; right: number; bottom: number; left: number };
}

/**
 * Renders a bar chart using the provided data.
 *
 * @param {object}      root0          - Component props
 * @param {DataPoint[]} root0.data     - Array of data points to display
 * @param {number}      root0.width    - Width of the chart in pixels
 * @param {number}      root0.height   - Height of the chart in pixels
 * @param {object}      [root0.margin] - Chart margins
 * @return {JSX.Element}              - The rendered bar chart component
 */
export function BarChart( {
	data,
	width,
	height,
	margin = { top: 20, right: 20, bottom: 40, left: 40 },
}: BarChartProps ) {
	// Calculate bounds
	const xMax = width - margin.left - margin.right;
	const yMax = height - margin.top - margin.bottom;

	// Scales
	const xScale = scaleBand< string >( {
		range: [ 0, xMax ],
		domain: data.map( d => d.label ),
		padding: 0.2,
	} );

	const yScale = scaleLinear< number >( {
		range: [ yMax, 0 ],
		domain: [ 0, Math.max( ...data.map( d => d.value ) ) ],
	} );

	return (
		<svg width={ width } height={ height }>
			<Group left={ margin.left } top={ margin.top }>
				{ data.map( d => {
					const barWidth = xScale.bandwidth();
					const barHeight = yMax - ( yScale( d.value ) ?? 0 );
					const x = xScale( d.label );
					const y = yScale( d.value );

					return (
						<Bar
							key={ `bar-${ d.label }` }
							x={ x }
							y={ y }
							width={ barWidth }
							height={ barHeight }
							fill="#0675C4"
						/>
					);
				} ) }

				<AxisLeft scale={ yScale } />
				<AxisBottom
					scale={ xScale }
					top={ yMax }
					tickLabelProps={ () => ( {
						transform: 'rotate(-45)',
						textAnchor: 'end',
						dy: '0.5em',
						dx: '-0.5em',
					} ) }
				/>
			</Group>
		</svg>
	);
}
