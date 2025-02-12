import { localPoint } from '@visx/event';
import { Group } from '@visx/group';
import { Pie } from '@visx/shape';
import { Text } from '@visx/text';
import { useTooltip } from '@visx/tooltip';
import clsx from 'clsx';
import { FC, useCallback } from 'react';
import { useChartTheme } from '../../providers/theme/theme-provider';
import { Legend } from '../legend';
import { withResponsive } from '../shared/with-responsive';
import { BaseTooltip } from '../tooltip';
import styles from './pie-semi-circle-chart.module.scss';
import type { BaseChartProps, DataPointPercentage } from '../../types';
import type { PieArcDatum } from '@visx/shape/lib/shapes/Pie';

interface PieSemiCircleChartProps extends BaseChartProps< DataPointPercentage[] > {
	/**
	 * Width of the chart in pixels; height would be half of this value calculated automatically.
	 */
	width?: number;

	/**
	 * Thickness of the pie chart. A value between 0 and 1
	 */
	thickness?: number;

	/**
	 * Direction of chart rendering
	 * true for clockwise, false for counter-clockwise
	 */
	clockwise?: boolean;

	/**
	 * Label text to display above the chart
	 */
	label?: string;

	/**
	 * Note text to display below the label
	 */
	note?: string;
}

type ArcData = PieArcDatum< DataPointPercentage >;

/**
 * Validates the semi-circle pie chart data
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

	// Validate total percentage is greater than 0
	const totalPercentage = data.reduce( ( sum, item ) => sum + item.percentage, 0 );
	if ( totalPercentage <= 0 ) {
		return { isValid: false, message: 'Invalid percentage total: Must be greater than 0' };
	}

	return { isValid: true, message: '' };
};

const PieSemiCircleChart: FC< PieSemiCircleChartProps > = ( {
	data,
	width = 400,
	thickness = 0.4,
	clockwise = true,
	withTooltips = false,
	showLegend = false,
	legendOrientation = 'horizontal',
	label,
	note,
	className,
} ) => {
	const providerTheme = useChartTheme();
	const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData, hideTooltip, showTooltip } =
		useTooltip< DataPointPercentage >();

	const handleMouseMove = useCallback(
		( event: React.MouseEvent, arc: ArcData ) => {
			const coords = localPoint( event );
			if ( ! coords ) return;

			showTooltip( {
				tooltipData: arc.data,
				tooltipLeft: coords.x,
				tooltipTop: coords.y - 10,
			} );
		},
		[ showTooltip ]
	);

	const handleMouseLeave = useCallback( () => {
		hideTooltip();
	}, [ hideTooltip ] );

	const handleArcMouseMove = useCallback(
		( arc: ArcData ) => ( event: React.MouseEvent ) => {
			handleMouseMove( event, arc );
		},
		[ handleMouseMove ]
	);

	// Add validation check
	const { isValid, message } = validateData( data );

	if ( ! isValid ) {
		return (
			<div className={ styles[ 'pie-semi-circle-chart' ] }>
				<svg width={ width } height={ width / 2 } data-testid="pie-chart-svg">
					<text x="50%" y="50%" textAnchor="middle" className={ styles.error }>
						{ message }
					</text>
				</svg>
			</div>
		);
	}

	const height = width / 2;
	const pad = 0.03;

	// Use padding for the overall chart dimensions
	const chartWidth = width - pad * 2;
	const chartHeight = height - pad;
	const radius = Math.min( chartWidth, chartHeight * 2 ) / 2;

	const innerRadius = radius * ( 1 - thickness + pad );

	// Map the data to include index for color assignment
	const dataWithIndex = data.map( ( d, index ) => ( {
		...d,
		index,
	} ) );

	// Set the clockwise direction based on the prop
	const startAngle = clockwise ? -Math.PI / 2 : Math.PI / 2;
	const endAngle = clockwise ? Math.PI / 2 : -Math.PI / 2;

	const accessors = {
		value: ( d: DataPointPercentage & { index: number } ) => d.value,
		sort: (
			a: DataPointPercentage & { index: number },
			b: DataPointPercentage & { index: number }
		) => b.value - a.value,
		// Use the color property from the data object as a last resort. The theme provides colours by default.
		fill: ( d: DataPointPercentage & { index: number } ) =>
			d.color || providerTheme.colors[ d.index % providerTheme.colors.length ],
	};

	// Create legend items
	const legendItems = data.map( ( item, index ) => ( {
		label: item.label,
		value: item.valueDisplay || item.value.toString(),
		color: accessors.fill( { ...item, index } ),
	} ) );

	return (
		<div
			className={ clsx( 'pie-semi-circle-chart', styles[ 'pie-semi-circle-chart' ], className ) }
			data-testid="pie-chart-container"
		>
			<svg
				width={ width }
				height={ height }
				viewBox={ `0 0 ${ width } ${ height }` }
				data-testid="pie-chart-svg"
			>
				{ /* Main chart group that contains both the pie and text elements */ }
				<Group top={ radius } left={ radius }>
					{ /* Pie chart */ }
					<Pie< DataPointPercentage & { index: number } >
						data={ dataWithIndex }
						pieValue={ accessors.value }
						outerRadius={ radius }
						innerRadius={ innerRadius }
						cornerRadius={ 3 }
						padAngle={ pad }
						startAngle={ startAngle }
						endAngle={ endAngle }
						pieSort={ accessors.sort }
					>
						{ pie => {
							return pie.arcs.map( arc => (
								<g
									key={ arc.data.label }
									onMouseMove={ handleArcMouseMove( arc ) }
									onMouseLeave={ handleMouseLeave }
								>
									<path
										d={ pie.path( arc ) || '' }
										fill={ accessors.fill( arc.data ) }
										data-testid="pie-segment"
									/>
								</g>
							) );
						} }
					</Pie>

					<Group>
						<Text
							textAnchor="middle"
							verticalAnchor="start"
							y={ -40 } // double font size to make room for a note
							className={ styles.label }
						>
							{ label }
						</Text>
						<Text
							textAnchor="middle"
							verticalAnchor="start"
							y={ -20 } // font size with padding
							className={ styles.note }
						>
							{ note }
						</Text>
					</Group>
				</Group>
			</svg>

			{ withTooltips && tooltipOpen && tooltipData && (
				<BaseTooltip
					data={ {
						label: tooltipData.label,
						value: tooltipData.value,
						valueDisplay: tooltipData.valueDisplay,
					} }
					top={ tooltipTop || 0 }
					left={ tooltipLeft || 0 }
				/>
			) }

			{ showLegend && (
				<Legend
					items={ legendItems }
					orientation={ legendOrientation }
					className={ styles[ 'pie-semi-circle-chart-legend' ] }
				/>
			) }
		</div>
	);
};

PieSemiCircleChart.displayName = 'PieSemiCircleChart';
export default withResponsive< PieSemiCircleChartProps >( PieSemiCircleChart );
