import { Group } from '@visx/group';
import { Pie } from '@visx/shape';
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
	useGlobalChartsTheme,
	GlobalChartsContext,
} from '../../providers';
import { attachSubComponents } from '../../utils';
import { getStringWidth } from '../../visx/text';
import { ChartSVG, ChartHTML, useChartChildren } from '../private/chart-composition';
import { RadialWipeAnimation } from '../private/radial-wipe-animation/';
import { SingleChartContext } from '../private/single-chart-context';
import { withResponsive, ResponsiveConfig } from '../private/with-responsive';
import styles from './pie-chart.module.scss';
import type { LegendValueDisplay } from '../../components/legend';
import type { BaseChartProps, DataPointPercentage, Optional } from '../../types';
import type { ChartComponentWithComposition } from '../private/chart-composition';
import type { SVGProps, MouseEvent, ReactNode, FC } from 'react';

export interface PieChartProps extends BaseChartProps< DataPointPercentage[] > {
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
	 * Whether to show labels on pie segments. Defaults to true.
	 */
	showLabels?: boolean;

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
	 * Use the children prop to render additional elements on the chart.
	 */
	children?: ReactNode;

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
type PieChartBaseProps = Optional< PieChartProps, 'size' >;

// Composition API types
type PieChartComponent = ChartComponentWithComposition< PieChartBaseProps >;
type PieChartResponsiveComponent = ChartComponentWithComposition<
	PieChartBaseProps & ResponsiveConfig
>;

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
const PieChartInternal = ( {
	data,
	chartId: providedChartId,
	withTooltips = false,
	className,
	showLegend = false,
	legendOrientation = 'horizontal',
	legendPosition = 'bottom',
	legendAlignment = 'center',
	legendMaxWidth,
	legendTextOverflow = 'wrap',
	legendItemClassName,
	legendShape = 'circle',
	size,
	animation,
	thickness = 1,
	padding = 0,
	gapScale = 0,
	cornerScale = 0,
	showLabels = true,
	legendValueDisplay = 'percentage',
	legendInteractive = false,
	children = null,
	tooltipOffsetX = 0,
	tooltipOffsetY = -15,
}: PieChartProps ) => {
	const providerTheme = useGlobalChartsTheme();
	const chartId = useChartId( providedChartId );
	const [ legendRef, legendHeight ] = useElementHeight< HTMLDivElement >();
	const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData, hideTooltip, showTooltip } =
		useTooltip< DataPointPercentage >();

	// Set up portal tooltip for better z-index handling
	// We get containerBounds to cancel out stale offsets in the position calculation
	const { containerRef, TooltipInPortal, containerBounds } = useTooltipInPortal( {
		detectBounds: true,
		scroll: true,
		debounce: 0,
	} );

	const onMouseLeave = useCallback( () => {
		if ( ! withTooltips ) {
			return;
		}
		hideTooltip();
	}, [ withTooltips, hideTooltip ] );

	const { getElementStyles, isSeriesVisible } = useGlobalChartsContext();

	// Filter and recalculate data for interactive legends
	const { visibleData, allSegmentsHidden, legendData } = useInteractiveLegendData( {
		data,
		chartId,
		legendInteractive,
		isSeriesVisible,
	} );

	// Memoize legend options to prevent unnecessary re-calculations
	const legendOptions = useMemo(
		() => ( { showValues: true, legendValueDisplay } ),
		[ legendValueDisplay ]
	);

	// Create legend items using legendData (has recalculated percentages for visible items)
	const legendItems = useChartLegendItems( legendData, legendOptions );

	const { isValid, message } = validateData( data );

	// Process children to extract compound components
	const { svgChildren, htmlChildren, otherChildren } = useChartChildren( children, 'PieChart' );

	// Memoize metadata to prevent unnecessary re-registration
	const chartMetadata = useMemo(
		() => ( {
			thickness,
			gapScale,
			cornerScale,
		} ),
		[ thickness, gapScale, cornerScale ]
	);

	// Register chart with context only if data is valid
	useChartRegistration( {
		chartId,
		legendItems,
		chartType: 'pie',
		isDataValid: isValid,
		metadata: chartMetadata,
	} );

	const prefersReducedMotion = usePrefersReducedMotion();

	if ( ! isValid ) {
		return (
			<div className={ clsx( 'pie-chart', styles[ 'pie-chart' ], className ) }>
				<div className={ styles[ 'error-message' ] }>{ message }</div>
			</div>
		);
	}

	const width = size;
	const height = size;
	const adjustedHeight = showLegend && legendPosition === 'top' ? height - legendHeight : height;

	// Calculate radius based on width/height
	const radius = Math.min( width, adjustedHeight ) / 2;

	// Center the chart in the available space
	const centerX = width / 2;
	const centerY = adjustedHeight / 2;

	// Calculate the angle between each (use original data length for consistent spacing)
	const padAngle = gapScale * ( ( 2 * Math.PI ) / data.length );

	const outerRadius = radius - padding;
	const innerRadius = thickness === 0 ? 0 : outerRadius * ( 1 - thickness );

	const maxCornerRadius = ( outerRadius - innerRadius ) / 2;
	const cornerRadius = cornerScale ? Math.min( cornerScale * outerRadius, maxCornerRadius ) : 0;

	// Map the data to include index for color assignment
	// When interactive, we need to find the original index to maintain consistent colors
	const dataWithIndex = visibleData.map( d => {
		const originalIndex = data.findIndex( item => item.label === d.label );
		return {
			...d,
			index: originalIndex >= 0 ? originalIndex : 0,
		};
	} );

	const accessors = {
		value: ( d: DataPointPercentage ) => d.value,
		fill: ( d: DataPointPercentage & { index: number } ) => {
			return getElementStyles( { data: d, index: d.index } ).color;
		},
	};

	return (
		<SingleChartContext.Provider
			value={ {
				chartId,
				chartWidth: width,
				chartHeight: adjustedHeight,
			} }
		>
			<div
				ref={ containerRef }
				className={ clsx(
					'pie-chart',
					styles[ 'pie-chart' ],
					{ [ styles[ 'pie-chart--legend-top' ] ]: showLegend && legendPosition === 'top' },
					className
				) }
			>
				<svg
					viewBox={ `0 0 ${ width } ${ adjustedHeight }` }
					preserveAspectRatio="xMidYMid meet"
					width={ width }
					height={ adjustedHeight }
				>
					<defs>
						<RadialWipeAnimation
							id={ `radial-wipe-${ chartId }` }
							radius={ outerRadius }
							innerRadius={ innerRadius }
						/>
					</defs>

					<Group
						top={ centerY }
						left={ centerX }
						mask={ animation && ! prefersReducedMotion ? `url(#radial-wipe-${ chartId })` : null }
					>
						{ allSegmentsHidden ? (
							<text
								textAnchor="middle"
								dy=".33em"
								fill={ providerTheme.gridColor || '#ccc' }
								fontSize="14"
								fontFamily="-apple-system,BlinkMacSystemFont,Roboto,Helvetica Neue,sans-serif"
							>
								{ __(
									'All segments are hidden. Click legend items to show data.',
									'jetpack-charts'
								) }
							</text>
						) : (
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
										const handleMouseMove = ( event: MouseEvent< SVGElement > ) => {
											if ( ! withTooltips ) {
												return;
											}

											// Don't show tooltip until container bounds are measured
											if ( containerBounds.width === 0 || containerBounds.height === 0 ) {
												return;
											}

											// Use clientX/Y and subtract containerBounds to cancel out any stale offset.
											// TooltipInPortal calculates: tooltipLeft + containerBounds.left + scrollX
											// By passing (clientX - containerBounds.left), we get:
											// (clientX - containerBounds.left) + containerBounds.left + scrollX = clientX + scrollX
											// This gives correct page coordinates regardless of stale bounds.
											showTooltip( {
												tooltipData: arc.data,
												tooltipLeft: event.clientX - containerBounds.left + tooltipOffsetX,
												tooltipTop: event.clientY - containerBounds.top + tooltipOffsetY,
											} );
										};

										const pathProps: SVGProps< SVGPathElement > & { 'data-testid'?: string } = {
											d: pie.path( arc ) || '',
											fill: accessors.fill( arc.data ),
											'data-testid': 'pie-segment',
										};

										const groupProps: SVGProps< SVGGElement > = {};
										if ( withTooltips ) {
											groupProps.onMouseMove = handleMouseMove;
											groupProps.onMouseLeave = onMouseLeave;
										}

										// Estimate text width more accurately for background sizing
										const fontSize = 12;
										const estimatedTextWidth = getStringWidth( arc.data.label, { fontSize } );
										const labelPadding = 6;
										const backgroundWidth = estimatedTextWidth + labelPadding * 2;
										const backgroundHeight = fontSize + labelPadding * 2;

										return (
											<g key={ `arc-${ index }` } { ...groupProps }>
												<path { ...pathProps } />
												{ showLabels && hasSpaceForLabel && (
													<g>
														{ providerTheme.labelBackgroundColor && (
															<rect
																x={ centroidX - backgroundWidth / 2 }
																y={ centroidY - backgroundHeight / 2 }
																width={ backgroundWidth }
																height={ backgroundHeight }
																fill={ providerTheme.labelBackgroundColor }
																rx={ 4 }
																ry={ 4 }
																pointerEvents="none"
															/>
														) }
														<text
															x={ centroidX }
															y={ centroidY }
															dy=".33em"
															fill={ providerTheme.labelTextColor || '#333' }
															fontSize={ fontSize }
															textAnchor="middle"
															pointerEvents="none"
														>
															{ arc.data.label }
														</text>
													</g>
												) }
											</g>
										);
									} );
								} }
							</Pie>
						) }

						{ /* Render SVG children (like Group, Text) inside the SVG */ }
						{ ! allSegmentsHidden && svgChildren }
					</Group>
				</svg>

				{ showLegend && (
					<Legend
						orientation={ legendOrientation }
						position={ legendPosition }
						alignment={ legendAlignment }
						maxWidth={ legendMaxWidth }
						textOverflow={ legendTextOverflow }
						legendItemClassName={ legendItemClassName }
						className={ styles[ 'pie-chart-legend' ] }
						shape={ legendShape }
						ref={ legendRef }
						chartId={ chartId }
						interactive={ legendInteractive }
					/>
				) }

				{ withTooltips && tooltipOpen && tooltipData && (
					<TooltipInPortal top={ tooltipTop || 0 } left={ tooltipLeft || 0 }>
						<div role="tooltip">
							<BaseTooltip data={ tooltipData } top={ 0 } left={ 0 } renderContainer={ false } />
						</div>
					</TooltipInPortal>
				) }

				{ /* Render HTML component children from PieChart.HTML */ }
				{ htmlChildren }

				{ /* Render other React children for backward compatibility */ }
				{ otherChildren }
			</div>
		</SingleChartContext.Provider>
	);
};

const PieChartWithProvider: FC< PieChartProps > = props => {
	const existingContext = useContext( GlobalChartsContext );

	// If we're already in a GlobalChartsProvider context, don't create a new one
	if ( existingContext ) {
		return <PieChartInternal { ...props } />;
	}

	// Otherwise, create our own GlobalChartsProvider
	return (
		<GlobalChartsProvider>
			<PieChartInternal { ...props } />
		</GlobalChartsProvider>
	);
};

PieChartWithProvider.displayName = 'PieChart';

// Create PieChart with composition API
const PieChart = attachSubComponents( PieChartWithProvider, {
	Legend: Legend,
	SVG: ChartSVG,
	HTML: ChartHTML,
} ) as PieChartComponent;

// Create responsive PieChart with composition API
const PieChartResponsive = attachSubComponents(
	withResponsive< PieChartProps >( PieChartWithProvider ),
	{
		Legend: Legend,
		SVG: ChartSVG,
		HTML: ChartHTML,
	}
) as PieChartResponsiveComponent;

export { PieChartResponsive as default, PieChart as PieChartUnresponsive };
