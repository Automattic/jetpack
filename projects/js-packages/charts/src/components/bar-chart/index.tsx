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
	showTooltips?: boolean;
};

/**
 * Renders a bar chart using the provided data.
 *
 * @param {BarChartProps} props - Component props
 * @return {JSX.Element} The rendered bar chart component
 */
function BarChart( {
	data,
	width,
	height,
	margin,
	showTooltips = false,
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
							onMouseMove={ showTooltips ? handleMouseMoveFor( d ) : undefined }
							onMouseLeave={ showTooltips ? hideTooltip : undefined }
						/>
					) ) }
					<AxisLeft scale={ yScale } />
					<AxisBottom scale={ xScale } top={ yMax } />
				</Group>
			</svg>
			{ showTooltips && tooltipData && (
				<TooltipWithBounds top={ tooltipTop } left={ tooltipLeft }>
					{ tooltipData.label }: { tooltipData.value }
				</TooltipWithBounds>
			) }
		</>
	);
}

export default withTooltip< BarChartProps, DataPoint >( BarChart );
