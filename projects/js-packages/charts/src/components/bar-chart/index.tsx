import { AxisLeft, AxisBottom } from '@visx/axis';
import { Group } from '@visx/group';
import { scaleBand, scaleLinear } from '@visx/scale';
import { Bar } from '@visx/shape';

export interface DataPoint {
	label: string;
	value: number;
}

interface BarChartProps {
	/**
	 * Array of data points to display
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
	margin?: { top: number; right: number; bottom: number; left: number };
}

/**
 * Renders a bar chart using the provided data.
 *
 * @param {BarChartProps} props - Component props
 * @return {JSX.Element} The rendered bar chart component
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
						textAnchor: 'middle',
						dy: '0.75em',
					} ) }
				/>
			</Group>
		</svg>
	);
}
