import { localPoint } from '@visx/event';
import { Group } from '@visx/group';
import { Pie } from '@visx/shape';
import { Text } from '@visx/text';
import { useTooltip } from '@visx/tooltip';
import clsx from 'clsx';
import { useCallback, useContext, useMemo } from 'react';
import { useElementHeight } from '../../hooks';
import {
	GlobalChartsProvider,
	useChartId,
	useChartRegistration,
	useGlobalChartsContext,
	GlobalChartsContext,
} from '../../providers';
import { attachSubComponents } from '../../utils';
import { Legend, useChartLegendItems } from '../legend';
import { ChartSVG, ChartHTML, useChartChildren } from '../private/chart-composition';
import { SingleChartContext } from '../private/single-chart-context';
import { withResponsive } from '../private/with-responsive';
import { BaseTooltip } from '../tooltip';
import styles from './pie-semi-circle-chart.module.scss';
import type { BaseChartProps, DataPointPercentage, Optional } from '../../types';
import type { LegendValueDisplay } from '../legend';
import type { ChartComponentWithComposition } from '../private/chart-composition';
import type { ResponsiveConfig } from '../private/with-responsive';
import type { PieArcDatum } from '@visx/shape/lib/shapes/Pie';
import type { FC, MouseEvent, ReactNode } from 'react';

const PAD_ANGLE = 0.03; // Padding between segments

export interface PieSemiCircleChartProps extends BaseChartProps< DataPointPercentage[] > {
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

	/**
	 * Use the children prop to render additional elements on the chart.
	 */
	children?: ReactNode;

	/**
	 * What type of value to display in the legend when showValues is true.
	 * - 'percentage': Shows percentage values (e.g., "23%") [default]
	 * - 'value': Shows raw numeric values (e.g., "30000")
	 * - 'valueDisplay': Shows formatted values (e.g., "30K")
	 * - 'none': Shows no values, only labels
	 */
	legendValueDisplay?: LegendValueDisplay;
}

// Base props type with optional responsive properties
type PieSemiCircleChartBaseProps = Optional< PieSemiCircleChartProps, 'width' >;

// Composition API types
type PieSemiCircleChartComponent = ChartComponentWithComposition< PieSemiCircleChartBaseProps >;
type PieSemiCircleChartResponsiveComponent = ChartComponentWithComposition<
	PieSemiCircleChartBaseProps & ResponsiveConfig
>;

export type ArcData = PieArcDatum< DataPointPercentage >;

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

const PieSemiCircleChartInternal: FC< PieSemiCircleChartProps > = ( {
	data,
	chartId: providedChartId,
	width = 400,
	thickness = 0.4,
	clockwise = true,
	withTooltips = false,
	showLegend = false,
	legendOrientation = 'horizontal',
	legendPosition = 'bottom',
	legendAlignment = 'center',
	legendShape = 'circle',
	legendValueDisplay = 'percentage',
	label,
	note,
	className,
	children,
} ) => {
	const chartId = useChartId( providedChartId );
	const [ legendRef, legendHeight ] = useElementHeight< HTMLDivElement >();
	const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData, hideTooltip, showTooltip } =
		useTooltip< DataPointPercentage >();

	const handleMouseMove = useCallback(
		( event: MouseEvent, arc: ArcData ) => {
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
		( arc: ArcData ) => ( event: MouseEvent ) => {
			handleMouseMove( event, arc );
		},
		[ handleMouseMove ]
	);

	// Validate data first to get validation result
	const { isValid, message } = validateData( data );

	const { resolveGroupColor } = useGlobalChartsContext();

	// Define accessors with useMemo to avoid changing dependencies
	const accessors = useMemo(
		() => ( {
			value: ( d: DataPointPercentage ) => d.value,
			sort: (
				a: DataPointPercentage & { index: number },
				b: DataPointPercentage & { index: number }
			) => b.value - a.value,
			fill: ( { group, index, color: overrideColor }: DataPointPercentage & { index: number } ) =>
				resolveGroupColor( { group, index, overrideColor } ),
		} ),
		[ resolveGroupColor ]
	);

	// Memoize legend options to prevent unnecessary re-calculations
	const legendOptions = useMemo(
		() => ( { showValues: true, legendValueDisplay } ),
		[ legendValueDisplay ]
	);

	// Create legend items using the reusable hook
	const legendItems = useChartLegendItems( data, legendOptions );

	// Process children to extract compound components
	const { svgChildren, htmlChildren, otherChildren } = useChartChildren(
		children,
		'PieSemiCircleChart'
	);

	// Memoize metadata to prevent unnecessary re-registration
	const chartMetadata = useMemo(
		() => ( {
			thickness,
			clockwise,
		} ),
		[ thickness, clockwise ]
	);

	// Register chart with context only if data is valid
	useChartRegistration( {
		chartId,
		legendItems,
		chartType: 'pie-semi-circle',
		isDataValid: isValid,
		metadata: chartMetadata,
	} );

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

	// Calculate chart dimensions
	// TODO: we might want to accept height as a prop in the future, because the height of container might not always be enough.
	const height = width / 2;
	// The chart only takes the height minus the legend height.
	const chartHeight = height - ( showLegend && legendPosition === 'top' ? legendHeight : 0 );
	const radius = Math.min( width / 2, chartHeight );
	const innerRadius = radius * ( 1 - thickness );

	// Map data with index for color assignment
	const dataWithIndex = data.map( ( d, index ) => ( {
		...d,
		index,
	} ) );

	// Configure pie angles based on clockwise direction
	const startAngle = clockwise ? -Math.PI / 2 : Math.PI / 2;
	const endAngle = clockwise ? Math.PI / 2 : -Math.PI / 2;

	return (
		<SingleChartContext.Provider
			value={ {
				chartId,
				chartWidth: width,
				chartHeight: radius,
			} }
		>
			<div
				className={ clsx( 'pie-semi-circle-chart', styles[ 'pie-semi-circle-chart' ], className ) }
				data-testid="pie-chart-container"
				style={ {
					display: 'flex',
					flexDirection: showLegend && legendPosition === 'top' ? 'column-reverse' : 'column',
				} }
			>
				<svg
					width={ width }
					height={ radius }
					viewBox={ `0 0 ${ width } ${ chartHeight }` }
					data-testid="pie-chart-svg"
				>
					{ /* Main chart group centered horizontally and positioned at bottom */ }
					<Group top={ chartHeight } left={ width / 2 }>
						{ /* Pie chart */ }
						<Pie< DataPointPercentage & { index: number } >
							data={ dataWithIndex }
							pieValue={ accessors.value }
							outerRadius={ radius }
							innerRadius={ innerRadius }
							cornerRadius={ 3 }
							padAngle={ PAD_ANGLE }
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

						{ /* Label and note text */ }
						<Group>
							<Text
								textAnchor="middle"
								verticalAnchor="start"
								y={ -40 } // Position above the chart with space for note
								className={ styles.label }
							>
								{ label }
							</Text>
							<Text
								textAnchor="middle"
								verticalAnchor="start"
								y={ -20 } // Position between label and chart
								className={ styles.note }
							>
								{ note }
							</Text>
						</Group>

						{ /* Render SVG children from composition API */ }
						{ svgChildren }
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
						orientation={ legendOrientation }
						position={ legendPosition }
						alignment={ legendAlignment }
						shape={ legendShape }
						ref={ legendRef }
						chartId={ chartId }
					/>
				) }

				{ /* Render HTML children from composition API */ }
				{ htmlChildren }

				{ /* Render any other children that aren't compound components */ }
				{ otherChildren }
			</div>
		</SingleChartContext.Provider>
	);
};

const PieSemiCircleChartWithProvider: FC< PieSemiCircleChartProps > = props => {
	const existingContext = useContext( GlobalChartsContext );

	// If we're already in a GlobalChartsProvider context, don't create a new one
	if ( existingContext ) {
		return <PieSemiCircleChartInternal { ...props } />;
	}

	// Otherwise, create our own GlobalChartsProvider
	return (
		<GlobalChartsProvider>
			<PieSemiCircleChartInternal { ...props } />
		</GlobalChartsProvider>
	);
};

PieSemiCircleChartWithProvider.displayName = 'PieSemiCircleChart';

// Create PieSemiCircleChart with composition API
const PieSemiCircleChart = attachSubComponents( PieSemiCircleChartWithProvider, {
	Legend: Legend,
	SVG: ChartSVG,
	HTML: ChartHTML,
} ) as PieSemiCircleChartComponent;

// Create responsive PieSemiCircleChart with composition API
const PieSemiCircleChartResponsive = attachSubComponents(
	withResponsive< PieSemiCircleChartProps >( PieSemiCircleChartWithProvider ),
	{
		Legend: Legend,
		SVG: ChartSVG,
		HTML: ChartHTML,
	}
) as PieSemiCircleChartResponsiveComponent;

export {
	PieSemiCircleChartResponsive as default,
	PieSemiCircleChart as PieSemiCircleChartUnresponsive,
};
