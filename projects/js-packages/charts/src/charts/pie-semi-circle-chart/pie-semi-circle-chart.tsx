import { localPoint } from '@visx/event';
import { Group } from '@visx/group';
import { Pie } from '@visx/shape';
import { Text } from '@visx/text';
import { useTooltip, useTooltipInPortal } from '@visx/tooltip';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useCallback, useContext, useMemo } from 'react';
import { Legend, useChartLegendItems } from '../../components/legend';
import { BaseTooltip } from '../../components/tooltip';
import { useElementHeight, useInteractiveLegendData, usePrefersReducedMotion } from '../../hooks';
import {
	GlobalChartsProvider,
	useChartId,
	useChartRegistration,
	useGlobalChartsContext,
	GlobalChartsContext,
} from '../../providers';
import { attachSubComponents } from '../../utils';
import { ChartSVG, ChartHTML, useChartChildren } from '../private/chart-composition';
import { RadialWipeAnimation } from '../private/radial-wipe-animation';
import { SingleChartContext } from '../private/single-chart-context';
import { withResponsive } from '../private/with-responsive';
import styles from './pie-semi-circle-chart.module.scss';
import type { LegendValueDisplay } from '../../components/legend';
import type { BaseChartProps, DataPointPercentage, Optional } from '../../types';
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

	/**
	 * Enable interactive legend items that can toggle segment visibility.
	 * Requires chartId and GlobalChartsProvider.
	 * When segments are hidden, percentages are recalculated so visible segments total 100%.
	 */
	legendInteractive?: boolean;

	/**
	 * Horizontal offset for tooltip positioning in pixels (default: 0)
	 */
	tooltipOffsetX?: number;

	/**
	 * Vertical offset for tooltip positioning in pixels (default: -15)
	 */
	tooltipOffsetY?: number;
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
	legendMaxWidth,
	legendTextOverflow = 'wrap',
	legendItemClassName,
	legendShape = 'circle',
	legendValueDisplay = 'percentage',
	legendInteractive = false,
	label,
	animation,
	note,
	className,
	children,
	tooltipOffsetX = 0,
	tooltipOffsetY = -15,
} ) => {
	const chartId = useChartId( providedChartId );
	const [ legendRef, legendHeight ] = useElementHeight< HTMLDivElement >();
	const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData, hideTooltip, showTooltip } =
		useTooltip< DataPointPercentage >();

	// Set up portal tooltip for better z-index handling
	const { containerRef, TooltipInPortal } = useTooltipInPortal( {
		detectBounds: true,
		scroll: true,
		debounce: 0,
	} );

	const handleMouseMove = useCallback(
		( event: MouseEvent< SVGElement >, arc: ArcData ) => {
			// Get coordinates relative to the current target element
			const coords = localPoint( event );
			if ( coords ) {
				// Account for legend offset when legend is on top
				const legendOffset = showLegend && legendPosition === 'top' ? legendHeight : 0;
				showTooltip( {
					tooltipData: arc.data,
					tooltipLeft: coords.x + tooltipOffsetX,
					tooltipTop: coords.y + legendOffset + tooltipOffsetY,
				} );
			}
		},
		[ showTooltip, tooltipOffsetX, tooltipOffsetY, showLegend, legendPosition, legendHeight ]
	);

	const handleMouseLeave = useCallback( () => {
		hideTooltip();
	}, [ hideTooltip ] );

	const handleArcMouseMove = useCallback(
		( arc: ArcData ) => ( event: MouseEvent< SVGElement > ) => {
			handleMouseMove( event, arc );
		},
		[ handleMouseMove ]
	);

	// Validate data first to get validation result
	const { isValid, message } = validateData( data );

	const { getElementStyles, isSeriesVisible } = useGlobalChartsContext();

	// Filter and recalculate data for interactive legends
	const { visibleData, allSegmentsHidden, legendData } = useInteractiveLegendData( {
		data,
		chartId,
		legendInteractive,
		isSeriesVisible,
	} );

	// Define accessors with useMemo to avoid changing dependencies
	const accessors = useMemo(
		() => ( {
			value: ( d: DataPointPercentage ) => d.value,
			sort: (
				a: DataPointPercentage & { index: number },
				b: DataPointPercentage & { index: number }
			) => b.value - a.value,
			fill: ( d: DataPointPercentage & { index: number } ) =>
				getElementStyles( { data: d, index: d.index } ).color,
		} ),
		[ getElementStyles ]
	);

	// Memoize legend options to prevent unnecessary re-calculations
	const legendOptions = useMemo(
		() => ( { showValues: true, legendValueDisplay } ),
		[ legendValueDisplay ]
	);

	// Create legend items using legendData (has recalculated percentages for visible items)
	const legendItems = useChartLegendItems( legendData, legendOptions );

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

	const prefersReducedMotion = usePrefersReducedMotion();

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
	// When interactive, we need to find the original index to maintain consistent colors
	const dataWithIndex = visibleData.map( d => {
		const originalIndex = data.findIndex( item => item.label === d.label );
		return {
			...d,
			index: originalIndex >= 0 ? originalIndex : 0,
		};
	} );

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
				ref={ containerRef }
				className={ clsx(
					'pie-semi-circle-chart',
					styles[ 'pie-semi-circle-chart' ],
					{
						[ styles[ 'pie-semi-circle-chart--legend-top' ] ]:
							showLegend && legendPosition === 'top',
					},
					className
				) }
				data-testid="pie-chart-container"
			>
				<svg
					width={ width }
					height={ radius }
					viewBox={ `0 0 ${ width } ${ chartHeight }` }
					data-testid="pie-chart-svg"
				>
					<defs>
						<RadialWipeAnimation
							id={ `radial-wipe-${ chartId }` }
							radius={ radius }
							innerRadius={ innerRadius }
							startAngle="-180deg"
							wipePercentage={ 50 }
						/>
					</defs>

					{ /* Main chart group centered horizontally and positioned at bottom */ }
					<Group
						top={ chartHeight }
						left={ width / 2 }
						mask={ animation && ! prefersReducedMotion ? `url(#radial-wipe-${ chartId })` : null }
					>
						{ allSegmentsHidden ? (
							<text
								textAnchor="middle"
								y={ -radius / 2 }
								fill="#ccc"
								fontSize="14"
								fontFamily="-apple-system,BlinkMacSystemFont,Roboto,Helvetica Neue,sans-serif"
							>
								{ __(
									'All segments are hidden. Click legend items to show data.',
									'jetpack-charts'
								) }
							</text>
						) : (
							<>
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
												onMouseMove={ withTooltips ? handleArcMouseMove( arc ) : undefined }
												onMouseLeave={ withTooltips ? handleMouseLeave : undefined }
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
								{ ! allSegmentsHidden && svgChildren }
							</>
						) }
					</Group>
				</svg>

				{ withTooltips && tooltipOpen && tooltipData && (
					<TooltipInPortal top={ tooltipTop || 0 } left={ tooltipLeft || 0 }>
						<div role="tooltip">
							<BaseTooltip data={ tooltipData } top={ 0 } left={ 0 } renderContainer={ false } />
						</div>
					</TooltipInPortal>
				) }

				{ showLegend && (
					<Legend
						orientation={ legendOrientation }
						position={ legendPosition }
						alignment={ legendAlignment }
						maxWidth={ legendMaxWidth }
						textOverflow={ legendTextOverflow }
						legendItemClassName={ legendItemClassName }
						shape={ legendShape }
						ref={ legendRef }
						chartId={ chartId }
						interactive={ legendInteractive }
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
