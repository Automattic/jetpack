import { Group } from '@visx/group';
import { Pie } from '@visx/shape';
import { Text } from '@visx/text';
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
	GlobalChartsContext,
} from '../../providers';
import { attachSubComponents } from '../../utils';
import { Center } from '../private/center';
import { ChartSVG, ChartHTML, useChartChildren } from '../private/chart-composition';
import { ChartLayout } from '../private/chart-layout';
import { RadialWipeAnimation } from '../private/radial-wipe-animation';
import { SingleChartContext } from '../private/single-chart-context';
import { SvgEmptyState } from '../private/svg-empty-state';
import { withResponsive } from '../private/with-responsive';
import styles from './pie-semi-circle-chart.module.scss';
import type { LegendValueDisplay } from '../../components/legend';
import type {
	BaseChartProps,
	DataPointPercentage,
	DataPointPercentageCalculated,
	Optional,
} from '../../types';
import type { ChartComponentWithComposition } from '../private/chart-composition';
import type { ResponsiveConfig } from '../private/with-responsive';
import type { PieProvidedProps } from '@visx/shape';
import type { FC, MouseEvent, ReactNode } from 'react';

/**
 * Parameters passed to the renderTooltip function for semi-circle charts.
 */
export type PieSemiCircleChartRenderTooltipParams = {
	/**
	 * The data point being hovered, including label, value, and calculated percentage.
	 */
	tooltipData: DataPointPercentageCalculated;
};

/**
 * Default tooltip renderer for semi-circle pie charts.
 * Renders a BaseTooltip with the hovered segment's data.
 *
 * @param {PieSemiCircleChartRenderTooltipParams} params - The tooltip parameters containing the hovered data point
 * @return {ReactNode} The rendered tooltip content
 */
const renderDefaultPieSemiCircleTooltip = ( {
	tooltipData,
}: PieSemiCircleChartRenderTooltipParams ): ReactNode => {
	return <BaseTooltip data={ tooltipData } top={ 0 } left={ 0 } renderContainer={ false } />;
};

const PAD_ANGLE = 0.03; // Padding between segments
const DEFAULT_WIDTH = 400;

export interface PieSemiCircleChartProps extends BaseChartProps< DataPointPercentage[] > {
	/**
	 * Explicit width of the chart container in pixels.
	 * When omitted, the chart fills its parent container's width.
	 * The chart always maintains a 2:1 width-to-height ratio, constrained by available space.
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
	renderTooltip?: ( params: PieSemiCircleChartRenderTooltipParams ) => ReactNode;
}

// Base props type with optional responsive properties
type PieSemiCircleChartBaseProps = Optional< PieSemiCircleChartProps, 'width' >;

// Composition API types
type PieSemiCircleChartComponent = ChartComponentWithComposition< PieSemiCircleChartBaseProps >;
type PieSemiCircleChartResponsiveComponent = ChartComponentWithComposition<
	PieSemiCircleChartBaseProps & ResponsiveConfig
>;

export type ArcData = PieProvidedProps< DataPointPercentageCalculated >[ 'arcs' ][ number ];

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

const PieSemiCircleChartInternal: FC< PieSemiCircleChartProps > = ( {
	data,
	chartId: providedChartId,
	width: propWidth,
	height: propHeight,
	thickness = 0.4,
	clockwise = true,
	withTooltips = false,
	showLegend = false,
	legend = {},
	legendValueDisplay = 'percentage',
	label,
	animation,
	note,
	className,
	children,
	tooltipOffsetX = 0,
	tooltipOffsetY = -15,
	renderTooltip = renderDefaultPieSemiCircleTooltip,
	gap = 'md',
} ) => {
	const legendInteractive = legend.interactive ?? false;
	const legendPosition = legend.position ?? 'bottom';

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

	const handleMouseMove = useCallback(
		( event: MouseEvent< SVGElement >, arc: ArcData ) => {
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
		},
		[
			containerBounds.width,
			containerBounds.height,
			containerBounds.left,
			containerBounds.top,
			showTooltip,
			tooltipOffsetX,
			tooltipOffsetY,
		]
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

	// Calculate percentages from values (single source of truth)
	const dataWithPercentages = useDataWithPercentages( data );

	// Filter and recalculate data for interactive legends
	const { visibleData, allSegmentsHidden, legendData } = useInteractiveLegendData( {
		data: dataWithPercentages,
		chartId,
		legendInteractive,
		isSeriesVisible,
	} );

	// Define accessors with useMemo to avoid changing dependencies
	const accessors = useMemo(
		() => ( {
			value: ( d: DataPointPercentageCalculated ) => d.value,
			sort: (
				a: DataPointPercentageCalculated & { index: number },
				b: DataPointPercentageCalculated & { index: number }
			) => b.value - a.value,
			fill: ( d: DataPointPercentageCalculated & { index: number } ) =>
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
	const { svgChildren, htmlChildren, legendChildren, otherChildren } = useChartChildren(
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

	const effectiveWidth = propWidth || DEFAULT_WIDTH;

	if ( ! isValid ) {
		const errorWidth = propHeight
			? Math.min( propWidth || propHeight * 2, propHeight * 2 )
			: effectiveWidth;
		const errorHeight = errorWidth / 2;

		return (
			<div className={ styles[ 'pie-semi-circle-chart' ] }>
				<svg width={ errorWidth } height={ errorHeight } data-testid="pie-chart-svg">
					<text x="50%" y="50%" textAnchor="middle" className={ styles.error }>
						{ message }
					</text>
				</svg>
			</div>
		);
	}

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
					'pie-semi-circle-chart',
					styles[ 'pie-semi-circle-chart' ],
					{
						[ styles[ 'pie-semi-circle-chart--responsive' ] ]: ! propWidth && ! propHeight,
					},
					className
				) }
				style={ {
					width: propWidth || undefined,
					height: propHeight || undefined,
				} }
				data-testid="pie-chart-container"
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
					// Calculate chart dimensions maintaining the 2:1 width-to-height ratio.
					// Use measured dimensions to respect height constraints, falling back
					// to explicit props during initial render before measurement is available.
					const availableWidth = contentWidth > 0 ? contentWidth : effectiveWidth;
					const availableHeight =
						contentHeight > 0 ? contentHeight : propHeight || effectiveWidth / 2;
					// Constrain width so that height (= width / 2) never exceeds the available height
					const width = Math.min( availableWidth, availableHeight * 2 );
					const height = width / 2;
					const radius = height; // For a semi-circle, radius equals the SVG height
					const innerRadius = radius * ( 1 - thickness );

					return (
						<Center ref={ containerRef }>
							<svg
								width={ width }
								height={ height }
								viewBox={ `0 0 ${ width } ${ height }` }
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
									top={ height }
									left={ width / 2 }
									mask={
										animation && ! prefersReducedMotion ? `url(#radial-wipe-${ chartId })` : null
									}
								>
									{ allSegmentsHidden ? (
										<SvgEmptyState x={ 0 } y={ -radius / 2 } width={ width } height={ height }>
											{ __(
												'All segments are hidden. Click legend items to show data.',
												'jetpack-charts'
											) }
										</SvgEmptyState>
									) : (
										<>
											{ /* Pie chart */ }
											<Pie< DataPointPercentageCalculated & { index: number } >
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
						</Center>
					);
				} }
			</ChartLayout>
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
