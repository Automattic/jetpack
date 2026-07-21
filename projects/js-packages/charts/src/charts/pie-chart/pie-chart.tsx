import { Group } from '@visx/group';
import { Pie } from '@visx/shape';
import { useTooltip, useTooltipInPortal } from '@visx/tooltip';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useCallback, useContext, useMemo } from 'react';
import { Legend, useChartLegendItems } from '../../components/legend';
import { BaseTooltip } from '../../components/tooltip';
import {
	useDataWithPercentages,
	useInteractiveLegendData,
	usePrefersReducedMotion,
} from '../../hooks';
import {
	GlobalChartsProvider,
	useChartId,
	useChartRegistration,
	useGlobalChartsContext,
	useGlobalChartsTheme,
	GlobalChartsContext,
} from '../../providers';
import { attachSubComponents, resolveFontSize } from '../../utils';
import { getStringWidth } from '../../visx/text';
import { Center } from '../private/center';
import { ChartSVG, ChartHTML, useChartChildren } from '../private/chart-composition';
import { ChartLayout } from '../private/chart-layout';
import { RadialWipeAnimation } from '../private/radial-wipe-animation/';
import { SingleChartContext } from '../private/single-chart-context';
import { SvgEmptyState } from '../private/svg-empty-state';
import { withResponsive, ResponsiveConfig } from '../private/with-responsive';
import styles from './pie-chart.module.scss';
import type { LegendValueDisplay } from '../../components/legend';
import type {
	BaseChartProps,
	DataPointPercentage,
	DataPointPercentageCalculated,
	Optional,
} from '../../types';
import type { ChartComponentWithComposition } from '../private/chart-composition';
import type { SVGProps, MouseEvent, ReactNode, FC } from 'react';

/**
 * Parameters passed to the renderTooltip function for pie charts.
 */
export type PieChartRenderTooltipParams = {
	/**
	 * The data point being hovered, including label, value, and calculated percentage.
	 */
	tooltipData: DataPointPercentageCalculated;
};

/**
 * Default tooltip renderer for pie charts.
 * Renders a BaseTooltip with the hovered segment's data.
 *
 * @param {PieChartRenderTooltipParams} params - The tooltip parameters containing the hovered data point
 * @return {ReactNode} The rendered tooltip content
 */
const renderDefaultPieTooltip = ( { tooltipData }: PieChartRenderTooltipParams ): ReactNode => {
	return <BaseTooltip data={ tooltipData } top={ 0 } left={ 0 } renderContainer={ false } />;
};

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

	/**
	 * Custom render function for tooltip content.
	 * When provided, replaces the default BaseTooltip with custom content.
	 */
	renderTooltip?: ( params: PieChartRenderTooltipParams ) => ReactNode;
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
	const hasNegativeValues = data.some( item => item.value < 0 );
	if ( hasNegativeValues ) {
		return { isValid: false, message: 'Invalid data: Negative values are not allowed' };
	}

	// Validate total value is greater than 0
	const totalValue = data.reduce( ( sum, item ) => sum + item.value, 0 );
	if ( totalValue <= 0 ) {
		return { isValid: false, message: 'Invalid data: Total value must be greater than 0' };
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
	legend = {},
	width: propWidth,
	height: propHeight,
	size,
	animation,
	thickness = 1,
	padding = 0,
	gapScale = 0,
	cornerScale = 0,
	showLabels = true,
	legendValueDisplay = 'percentage',
	children = null,
	tooltipOffsetX = 0,
	tooltipOffsetY = -15,
	renderTooltip = renderDefaultPieTooltip,
	gap = 'md',
}: PieChartProps ) => {
	const legendInteractive = legend.interactive ?? false;
	const legendPosition = legend.position ?? 'bottom';

	const providerTheme = useGlobalChartsTheme();
	const chartId = useChartId( providedChartId );
	const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData, hideTooltip, showTooltip } =
		useTooltip< DataPointPercentageCalculated >();

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

	// Calculate percentages from values (single source of truth)
	const dataWithPercentages = useDataWithPercentages( data );

	// Filter and recalculate data for interactive legends
	const { visibleData, allSegmentsHidden, legendData } = useInteractiveLegendData( {
		data: dataWithPercentages,
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
	const { svgChildren, htmlChildren, legendChildren, otherChildren } = useChartChildren(
		children,
		'PieChart'
	);

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

	// Calculate the angle between each (use original data length for consistent spacing)
	const padAngle = gapScale * ( ( 2 * Math.PI ) / data.length );

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
		value: ( d: DataPointPercentageCalculated ) => d.value,
		fill: ( d: DataPointPercentageCalculated & { index: number } ) => {
			return getElementStyles( { data: d, index: d.index } ).color;
		},
	};

	const legendElement = showLegend && (
		<Legend
			orientation={ legend.orientation ?? 'horizontal' }
			position={ legendPosition }
			alignment={ legend.alignment ?? 'center' }
			labelStyles={ legend.labelStyles }
			itemClassName={ legend.itemClassName }
			itemStyles={ legend.itemStyles }
			shapeStyles={ legend.shapeStyles }
			shape={ legend.shape ?? 'circle' }
			chartId={ chartId }
			interactive={ legendInteractive }
		/>
	);

	return (
		<SingleChartContext.Provider value={ { chartId } }>
			<ChartLayout
				legendPosition={ legendPosition }
				legendElement={ legendElement }
				legendChildren={ legendChildren }
				gap={ gap }
				className={ clsx(
					'pie-chart',
					styles[ 'pie-chart' ],
					// Fill parent when no explicit dimensions provided
					{ [ styles[ 'pie-chart--responsive' ] ]: ! propWidth && ! propHeight },
					className
				) }
				style={ {
					width: propWidth || undefined,
					height: propHeight || undefined,
				} }
				trailingContent={
					<>
						{ withTooltips && tooltipOpen && tooltipData && (
							<TooltipInPortal top={ tooltipTop || 0 } left={ tooltipLeft || 0 }>
								<div role="tooltip">{ renderTooltip( { tooltipData } ) }</div>
							</TooltipInPortal>
						) }
						{ htmlChildren }
						{ otherChildren }
					</>
				}
			>
				{ ( { contentWidth, contentHeight } ) => {
					const availableWidth = contentWidth > 0 ? contentWidth : 300;
					const availableHeight = contentHeight > 0 ? contentHeight : 300;
					const availableSize = Math.min( availableWidth, availableHeight );
					const actualSize = size ? Math.min( size, availableSize ) : availableSize;

					const width = actualSize;
					const height = actualSize;

					const radius = Math.min( width, height ) / 2;
					const centerX = width / 2;
					const centerY = height / 2;

					const outerRadius = radius - padding;
					const innerRadius = thickness === 0 ? 0 : outerRadius * ( 1 - thickness );

					const maxCornerRadius = ( outerRadius - innerRadius ) / 2;
					const cornerRadius = cornerScale
						? Math.min( cornerScale * outerRadius, maxCornerRadius )
						: 0;

					return (
						<Center ref={ containerRef }>
							<svg
								viewBox={ `0 0 ${ width } ${ height }` }
								preserveAspectRatio="xMidYMid meet"
								width={ width }
								height={ height }
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
									mask={
										animation && ! prefersReducedMotion ? `url(#radial-wipe-${ chartId })` : null
									}
								>
									{ allSegmentsHidden ? (
										<SvgEmptyState x={ 0 } y={ 0 } width={ width } height={ height }>
											{ __(
												'All segments are hidden. Click legend items to show data.',
												'jetpack-charts'
											) }
										</SvgEmptyState>
									) : (
										<Pie< DataPointPercentageCalculated & { index: number } >
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

													const pathProps: SVGProps< SVGPathElement > & {
														'data-testid'?: string;
													} = {
														d: pie.path( arc ) || '',
														fill: accessors.fill( arc.data ),
														'data-testid': 'pie-segment',
													};

													const groupProps: SVGProps< SVGGElement > = {};
													if ( withTooltips ) {
														groupProps.onMouseMove = handleMouseMove;
														groupProps.onMouseLeave = onMouseLeave;
													}

													const svgLabelSmall = providerTheme.svgLabelSmall;
													const fontSize = resolveFontSize( svgLabelSmall?.fontSize ) ?? 12;
													const estimatedTextWidth = getStringWidth( arc.data.label, {
														fontSize,
														fontFamily: svgLabelSmall?.fontFamily,
														fontWeight: svgLabelSmall?.fontWeight,
													} );
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
						</Center>
					);
				} }
			</ChartLayout>
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
