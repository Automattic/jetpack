import { localPoint } from '@visx/event';
import { Group } from '@visx/group';
import { Pie } from '@visx/shape';
import { useTooltip } from '@visx/tooltip';
import React from 'react';
import { useChartTheme } from '../../providers/theme/theme-provider';
import { Tooltip } from '../tooltip';
import type { DataPoint } from '../shared/types';

type PieChartProps = {
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
	 * Whether to show tooltips on hover
	 */
	showTooltips?: boolean;
};

/**
 * Renders a pie chart using the provided data.
 *
 * @param {PieChartProps} props - Component props
 * @return {JSX.Element} The rendered pie chart component
 */
const PieChart = ( { data, width, height, showTooltips = false }: PieChartProps ) => {
	const theme = useChartTheme();
	const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData, hideTooltip, showTooltip } =
		useTooltip< DataPoint >();

	// Calculate radius based on width/height
	const radius = Math.min( width, height ) / 2;
	const centerX = width / 2;
	const centerY = height / 2;

	const handleMouseMove = React.useCallback(
		( event: React.MouseEvent< SVGPathElement >, datum: DataPoint ) => {
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

	return (
		<div style={ { position: 'relative' } }>
			<svg width={ width } height={ height }>
				<Group top={ centerY } left={ centerX }>
					<Pie
						data={ data }
						// eslint-disable-next-line react/jsx-no-bind
						pieValue={ d => d.value }
						outerRadius={ radius - 20 } // Leave space for labels/tooltips
						innerRadius={ 0 }
						padAngle={ 0.02 }
					>
						{ pie => {
							return pie.arcs.map( ( arc, index ) => {
								const [ centroidX, centroidY ] = pie.path.centroid( arc );
								const hasSpaceForLabel = arc.endAngle - arc.startAngle >= 0.25;

								return (
									<g key={ `arc-${ index }` }>
										<path
											d={ pie.path( arc ) || '' }
											fill={ theme.colors[ index % theme.colors.length ] }
											// eslint-disable-next-line react/jsx-no-bind
											onMouseMove={
												showTooltips ? event => handleMouseMove( event, arc.data ) : undefined
											}
											onMouseLeave={ showTooltips ? handleMouseLeave : undefined }
										/>
										{ hasSpaceForLabel && (
											<text
												x={ centroidX }
												y={ centroidY }
												dy=".33em"
												fill="#ffffff"
												fontSize={ 12 }
												textAnchor="middle"
												pointerEvents="none"
											>
												{ arc.data.label }
											</text>
										) }
									</g>
								);
							} );
						} }
					</Pie>
				</Group>
			</svg>
			{ tooltipOpen && tooltipData && (
				<Tooltip data={ tooltipData } top={ tooltipTop } left={ tooltipLeft } />
			) }
		</div>
	);
};

export default PieChart;
