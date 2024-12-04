import { AxisLeft, AxisBottom } from '@visx/axis';
import { Group } from '@visx/group';
import { scaleBand, scaleLinear } from '@visx/scale';
import { Bar } from '@visx/shape';

export interface DataPoint {
	label: string;
	value: number;
}

type BarChartProps = {
	data: DataPoint[];
	width: number;
	height: number;
	margin?: {
		[ K in 'top' | 'right' | 'bottom' | 'left' ]?: number;
	};
};

/**
 * Renders a bar chart using the provided data.
 *
 * @param {BarChartProps} props - Component props
 * @return {JSX.Element} The rendered bar chart component
 */
export function BarChart( { data, width, height, margin }: BarChartProps ) {
	const margins = { top: 20, right: 20, bottom: 40, left: 40, ...margin };

	// Calculate bounds
	const xMax = width - margins.left - margins.right;
	const yMax = height - margins.top - margins.bottom;

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

	/**
	 * Returns the props for tick labels on the x-axis.
	 *
	 * @return {object} The tick label props
	 */
	function getTickLabelProps() {
		return {
			textAnchor: 'middle' as const,
			dy: '0.75em',
		};
	}

	return (
		<svg width={ width } height={ height }>
			<Group left={ margins.left } top={ margins.top }>
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
				<AxisBottom scale={ xScale } top={ yMax } tickLabelProps={ getTickLabelProps() } />
			</Group>
		</svg>
	);
}
