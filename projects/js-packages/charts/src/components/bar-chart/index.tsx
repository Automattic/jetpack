import { AxisLeft, AxisBottom } from '@visx/axis';
import { Group } from '@visx/group';
import { scaleBand, scaleLinear } from '@visx/scale';
import { Bar } from '@visx/shape';
import { withTooltip, TooltipWithBounds } from '@visx/tooltip';
import type { DataPoint } from '../shared/types';
import type { WithTooltipProvidedProps } from '@visx/tooltip/lib/enhancers/withTooltip';

type BarChartProps = {
	data: DataPoint[];
	width: number;
	height: number;
	margin?: {
		[ K in 'top' | 'right' | 'bottom' | 'left' ]?: number;
	};
};

/**
 * Renders a bar chart component with tooltips on hover.
 *
 * @param {object}      root0             - Props object
 * @param {DataPoint[]} root0.data        - Array of data points to display in the chart
 * @param {number}      root0.width       - Width of the chart in pixels
 * @param {number}      root0.height      - Height of the chart in pixels
 * @param {object}      root0.margin      - Chart margins
 * @param {Function}    root0.showTooltip - Show tooltip callback
 * @param {Function}    root0.hideTooltip - Hide tooltip callback
 * @param {DataPoint}   root0.tooltipData - Current tooltip data
 * @param {number}      root0.tooltipLeft - Tooltip x position
 * @param {number}      root0.tooltipTop  - Tooltip y position
 * @return {JSX.Element}                  - The rendered bar chart
 */
function BarChart( {
	data,
	width,
	height,
	margin,
	showTooltip,
	hideTooltip,
	tooltipData,
	tooltipLeft = 0,
	tooltipTop = 0,
}: BarChartProps & WithTooltipProvidedProps< DataPoint > ) {
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

	const handleMouseMove = ( event: React.MouseEvent< SVGRectElement >, datum: DataPoint ) => {
		const { clientX, clientY } = event;
		showTooltip( {
			tooltipData: datum,
			tooltipLeft: clientX,
			tooltipTop: clientY,
		} );
	};

	const handleMouseMoveFor =
		( datum: DataPoint ) => ( event: React.MouseEvent< SVGRectElement > ) => {
			handleMouseMove( event, datum );
		};

	return (
		<>
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
							onMouseMove={ handleMouseMoveFor( d ) }
							onMouseLeave={ hideTooltip }
						/>
					) ) }
					<AxisLeft scale={ yScale } />
					<AxisBottom scale={ xScale } top={ yMax } />
				</Group>
			</svg>
			{ tooltipData && (
				<TooltipWithBounds top={ tooltipTop } left={ tooltipLeft }>
					{ tooltipData.label }: { tooltipData.value }
				</TooltipWithBounds>
			) }
		</>
	);
}

export default withTooltip< BarChartProps, DataPoint >( BarChart );
