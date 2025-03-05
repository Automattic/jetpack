import { Group } from '@visx/group';
import { Pie } from '@visx/shape';
import clsx from 'clsx';
import { SVGProps, type MouseEvent } from 'react';
import useChartMouseHandler from '../../hooks/use-chart-mouse-handler';
import { useChartTheme, defaultTheme } from '../../providers/theme';
import { Legend } from '../legend';
import { withResponsive } from '../shared/with-responsive';
import { BaseTooltip } from '../tooltip';
import styles from './pie-chart.module.scss';
import type { BaseChartProps, DataPointPercentage } from '../../types';

// TODO: add animation

type OmitBaseChartProps = Omit< BaseChartProps< DataPointPercentage[] >, 'width' | 'height' >;

interface PieChartProps extends OmitBaseChartProps {
	/**
	 * Inner radius in pixels. If > 0, creates a donut chart. Defaults to 0.
	 */
	innerRadius?: number;

	/**
	 * Add padding to the chart
	 */
	padding?: number;

	/**
	 * Thickness of the pie chart.
	 * A value between 0 and 1, where 0 means no thickness
	 * and 1 means the maximum thickness.
	 */
	thickness?: number;

	/**
	 * Scale of the gap between groups in the pie chart
	 * A value between 0 and 1, where 0 means no gap.
	 */
	gapScale?: number;

	/**
	 * Scale of the corner radius for the pie chart segments.
	 * A value between 0 and 1, where 0 means no corner radius.
	 */
	cornerScale?: number;

	/**
	 * Use the children prop to render additional elements on the chart.
	 */
	children?: React.ReactNode;
}

/**
 * Validates the pie chart data
 * @param data - The data to validate
 * @return Object containing validation result and error message
 */
const validateData = ( data: DataPointPercentage[] ) => {
	if ( ! data.length ) {
		return { isValid: false, message: 'No data available' };
	}

	// Check for negative values
	const hasNegativeValues = data.some( item => item.percentage < 0 || item.value < 0 );
	if ( hasNegativeValues ) {
		return { isValid: false, message: 'Invalid data: Negative values are not allowed' };
	}

	// Validate total percentage
	const totalPercentage = data.reduce( ( sum, item ) => sum + item.percentage, 0 );
	if ( Math.abs( totalPercentage - 100 ) > 0.01 ) {
		// Using small epsilon for floating point comparison
		return { isValid: false, message: 'Invalid percentage total: Must equal 100' };
	}

	return { isValid: true, message: '' };
};

/**
 * Renders a pie or donut chart using the provided data.
 *
 * @param {PieChartProps} props - Component props
 * @return {JSX.Element} The rendered chart component
 */
const PieChart = ( {
	data,
	withTooltips = false,
	className,
	showLegend,
	legendOrientation,
	size,
	thickness = 1,
	padding = 20,
	gapScale = 0,
	cornerScale = 0,
	children = null,
}: PieChartProps ) => {
	const providerTheme = useChartTheme();
	const { onMouseMove, onMouseLeave, tooltipOpen, tooltipData, tooltipLeft, tooltipTop } =
		useChartMouseHandler( {
			withTooltips,
		} );

	const { isValid, message } = validateData( data );

	if ( ! isValid ) {
		return (
			<div className={ clsx( 'pie-chart', styles[ 'pie-chart' ], className ) }>
				<div className={ styles[ 'error-message' ] }>{ message }</div>
			</div>
		);
	}

	const width = size;
	const height = size;

	// Calculate radius based on width/height
	const radius = Math.min( width, height ) / 2;

	// Center the chart in the available space
	const centerX = width / 2;
	const centerY = height / 2;

	// Calculate the angle between each
	const padAngle = gapScale * ( ( 2 * Math.PI ) / data.length );

	const outerRadius = radius - padding;
	const innerRadius = outerRadius * ( 1 - thickness );

	const maxCornerRadius = ( outerRadius - innerRadius ) / 2;
	const cornerRadius = cornerScale ? Math.min( cornerScale * outerRadius, maxCornerRadius ) : 0;

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
			<svg
				viewBox={ `0 0 ${ size } ${ size }` }
				preserveAspectRatio="xMidYMid meet"
				width={ size }
				height={ size }
			>
				<Group top={ centerY } left={ centerX }>
					<Pie< DataPointPercentage & { index: number } >
						data={ dataWithIndex }
						pieValue={ accessors.value }
						outerRadius={ outerRadius }
						innerRadius={ innerRadius }
						padAngle={ padAngle }
						cornerRadius={ cornerRadius }
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

					{ children }
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

PieChart.displayName = 'PieChart';
export default withResponsive< PieChartProps >( PieChart );
