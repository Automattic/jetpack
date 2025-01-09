import { Group } from '@visx/group';
import { Pie } from '@visx/shape';
import clsx from 'clsx';
import { SVGProps, type MouseEvent } from 'react';
import useChartMouseHandler from '../../hooks/use-chart-mouse-handler';
import { useChartTheme, defaultTheme } from '../../providers/theme';
import { Legend } from '../legend';
import { BaseTooltip } from '../tooltip';
import styles from './pie-chart.module.scss';
import type { BaseChartProps, DataPointPercentage } from '../../types';

// TODO: add animation

interface PieChartProps extends BaseChartProps< DataPointPercentage[] > {
	/**
	 * Inner radius in pixels. If > 0, creates a donut chart. Defaults to 0.
	 */
	innerRadius?: number;
}

/**
 * Renders a pie or donut chart using the provided data.
 *
 * @param {PieChartProps} props - Component props
 * @return {JSX.Element} The rendered chart component
 */
const PieChart = ( {
	data,
	width = 500, //TODO: replace when making the components responsive
	height = 500, //TODO: replace when making the components responsive
	withTooltips = false,
	innerRadius = 0,
	className,
	showLegend,
	legendOrientation,
}: PieChartProps ) => {
	const providerTheme = useChartTheme();
	const { onMouseMove, onMouseLeave, tooltipOpen, tooltipData, tooltipLeft, tooltipTop } =
		useChartMouseHandler( {
			withTooltips,
		} );

	// Calculate radius based on width/height
	const radius = Math.min( width, height ) / 2;
	const centerX = width / 2;
	const centerY = height / 2;

	// Map the data to include index for color assignment
	const dataWithIndex = data.map( ( d, index ) => ( {
		...d,
		index,
	} ) );

	const accessors = {
		value: ( d: DataPointPercentage ) => d.value,
		// Use the color property from the data object as a last resort. The theme provides colours by default.
		fill: ( d: DataPointPercentage & { index: number } ) =>
			d?.color || providerTheme.colors[ d.index ],
	};

	// Create legend items from data
	const legendItems = data.map( ( item, index ) => ( {
		label: item.label,
		value: item.value.toString(),
		color: providerTheme.colors[ index % providerTheme.colors.length ],
	} ) );

	return (
		<div className={ clsx( 'pie-chart', styles[ 'pie-chart' ], className ) }>
			<svg width={ width } height={ height }>
				<Group top={ centerY } left={ centerX }>
					<Pie< DataPointPercentage & { index: number } >
						data={ dataWithIndex }
						pieValue={ accessors.value }
						outerRadius={ radius - 20 } // Leave space for labels/tooltips
						innerRadius={ innerRadius }
					>
						{ pie => {
							return pie.arcs.map( ( arc, index ) => {
								const [ centroidX, centroidY ] = pie.path.centroid( arc );
								const hasSpaceForLabel = arc.endAngle - arc.startAngle >= 0.25;
								const handleMouseMove = ( event: MouseEvent< SVGElement > ) =>
									onMouseMove( event, arc.data );

								const pathProps: SVGProps< SVGPathElement > = {
									d: pie.path( arc ) || '',
									fill: accessors.fill( arc.data ),
								};

								if ( withTooltips ) {
									pathProps.onMouseMove = handleMouseMove;
									pathProps.onMouseLeave = onMouseLeave;
								}

								return (
									<g key={ `arc-${ index }` }>
										<path { ...pathProps } />
										{ hasSpaceForLabel && (
											<text
												x={ centroidX }
												y={ centroidY }
												dy=".33em"
												fill={
													providerTheme.labelBackgroundColor || defaultTheme.labelBackgroundColor
												}
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

			{ showLegend && (
				<Legend
					items={ legendItems }
					orientation={ legendOrientation }
					className={ styles[ 'pie-chart-legend' ] }
				/>
			) }

			{ withTooltips && tooltipOpen && tooltipData && (
				<BaseTooltip
					data={ tooltipData }
					top={ tooltipTop || 0 }
					left={ tooltipLeft || 0 }
					style={ {
						transform: 'translate(-50%, -100%)',
					} }
				/>
			) }
		</div>
	);
};

export default PieChart;
