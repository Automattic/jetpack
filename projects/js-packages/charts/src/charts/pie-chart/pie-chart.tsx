import { Group } from '@visx/group';
import { arc, pie } from '@visx/shape';
import { color as d3Color } from '@visx/vendor/d3-color';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import isEqual from 'fast-deep-equal';
import { useContext, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Legend, useChartLegendItems } from '../../components/legend';
import { LabelValueContent } from '../../components/tooltip/private/label-value-content';
import {
	useDataWithPercentages,
	useLegendVisibilityData,
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
import { CATALOG_POINTERS } from '../../providers/chart-context/private/catalog-pointers';
import { attachSubComponents, createCssVariableResolver, resolveFontSize } from '../../utils';
import { getStringWidth } from '../../visx/text';
import { Center } from '../private/center';
import { ChartSVG, ChartHTML, useChartChildren } from '../private/chart-composition';
import { ChartInstanceContext } from '../private/chart-instance-context';
import { ChartLayout } from '../private/chart-layout';
import { pickLabelTextColor, resolveLabelRoles } from '../private/label-text-color';
import {
	orderArcsForNavigation,
	PieSelectionOutput,
	SelectedSegmentRing,
	usePieKeyboardNavigation,
} from '../private/pie-keyboard-navigation';
import { RadialWipeAnimation } from '../private/radial-wipe-animation/';
import { getAllHiddenMessage, SvgEmptyState } from '../private/svg-empty-state';
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
import type { LabelRoles, LabelTextColor } from '../private/label-text-color';
import type { PieProvidedProps } from '@visx/shape';
import type { JSX, ReactNode, FC } from 'react';

type PieDatum = DataPointPercentageCalculated & { index: number };
type PieArcDatum = PieProvidedProps< PieDatum >[ 'arcs' ][ number ];

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
 * Renders the default `label: value` tooltip content for the hovered segment.
 *
 * @param {PieChartRenderTooltipParams} params - The tooltip parameters containing the hovered data point
 * @return {ReactNode} The rendered tooltip content
 */
const renderDefaultPieTooltip = ( { tooltipData }: PieChartRenderTooltipParams ): ReactNode => {
	return <LabelValueContent data={ tooltipData } />;
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
	 * When provided, replaces the default `label: value` tooltip with custom content.
	 */
	renderTooltip?: ( params: PieChartRenderTooltipParams ) => ReactNode;

	/**
	 * Accessible name of the chart. Defaults to a localized "Pie chart".
	 */
	ariaLabel?: string;
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

// `label-inverse` is the stylesheet's default, so it needs no modifier.
const LABEL_TEXT_MODIFIER: Record< LabelTextColor, string | undefined > = {
	label: styles[ 'pie-chart__label-text--on-light' ],
	'label-inverse': undefined,
	black: styles[ 'pie-chart__label-text--black' ],
	white: styles[ 'pie-chart__label-text--white' ],
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
	ariaLabel,
	gap = 'md',
}: PieChartProps ) => {
	const legendInteractive = legend.interactive ?? false;
	const legendPosition = legend.position ?? 'bottom';

	const providerTheme = useGlobalChartsTheme();
	const chartId = useChartId( providedChartId );

	// The element the chart's own `className` lands on, so an override set there reaches this
	// decision the same way it reaches CSS.
	const rootRef = useRef< HTMLDivElement >( null );
	// Null until read, and while a label plate is set: text on the plate keeps the inverse role.
	const [ labelRoles, setLabelRoles ] = useState< LabelRoles | null >( null );

	const { getElementStyles, isSeriesVisible, isColorPaletteResolved } = useGlobalChartsContext();
	const { isValid, message } = validateData( data );

	// Skipped when labels are off, or before the chart's own root element mounts (the invalid-data
	// branch renders a plain div, so `rootRef` is not yet attached).
	useLayoutEffect( () => {
		if ( ! showLabels || ! rootRef.current ) {
			return;
		}

		const resolve = createCssVariableResolver( rootRef.current );
		const rawLabelBackground = resolve( CATALOG_POINTERS.labelBackground );
		// A plate value d3 cannot parse (CSS Color 4 syntax, say) is still one CSS paints, so it counts.
		const plateColor = rawLabelBackground ? d3Color( rawLabelBackground ) : null;
		const hasPlate = rawLabelBackground ? ! plateColor || plateColor.opacity > 0 : false;
		const next = hasPlate ? null : resolveLabelRoles( resolve );
		setLabelRoles( previous => ( isEqual( previous, next ) ? previous : next ) );
	}, [ showLabels, className, isColorPaletteResolved, isValid ] );

	// Calculate percentages from values (single source of truth)
	const dataWithPercentages = useDataWithPercentages( data );

	// Filter and recalculate data from the shared legend visibility state.
	const { visibleData, allSegmentsHidden, legendData } = useLegendVisibilityData( {
		data: dataWithPercentages,
		chartId,
		isSeriesVisible,
	} );

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
	const wipeMask = animation && ! prefersReducedMotion ? `url(#radial-wipe-${ chartId })` : null;

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

	const arcs = pie< PieDatum >( { value: accessors.value, padAngle } )( dataWithIndex );
	const navigationArcs = orderArcsForNavigation( arcs );

	const {
		chartRef,
		svgRef,
		selectedIndex,
		getSegmentHandlers,
		getKeyboardTooltipAnchor,
		outputProps,
		chartProps,
	} = usePieKeyboardNavigation( {
		segmentLabels: navigationArcs.map( arcDatum => arcDatum.data.label ),
		withTooltips,
		tooltipOffsetX,
		tooltipOffsetY,
	} );

	if ( ! isValid ) {
		return (
			<div className={ clsx( 'pie-chart', styles[ 'pie-chart' ], className ) }>
				<div className={ styles[ 'error-message' ] }>{ message }</div>
			</div>
		);
	}

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
		<ChartInstanceContext.Provider value={ { chartId } }>
			<ChartLayout
				legendPosition={ legendPosition }
				legendElement={ legendElement }
				legendChildren={ legendChildren }
				gap={ gap }
				rootRef={ rootRef }
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

					const path = arc< PieArcDatum >( { innerRadius, outerRadius, cornerRadius } );
					const selectedArc =
						selectedIndex === undefined ? undefined : navigationArcs[ selectedIndex ];

					const svgLabelSmall = providerTheme.svgLabelSmall;
					const fontSize = resolveFontSize( svgLabelSmall?.fontSize ) ?? 12;

					const renderLabel = ( arcDatum: PieArcDatum, index: number ) => {
						if ( arcDatum.endAngle - arcDatum.startAngle < 0.25 ) {
							return null;
						}

						const [ centroidX, centroidY ] = path.centroid( arcDatum );
						const estimatedTextWidth = getStringWidth( arcDatum.data.label, {
							fontSize,
							fontFamily: svgLabelSmall?.fontFamily,
							fontWeight: svgLabelSmall?.fontWeight,
						} );
						const labelPadding = 6;
						const backgroundWidth = estimatedTextWidth + labelPadding * 2;
						const backgroundHeight = fontSize + labelPadding * 2;

						return (
							<g key={ `label-${ index }` }>
								<rect
									className={ styles[ 'pie-chart__label-plate' ] }
									x={ centroidX - backgroundWidth / 2 }
									y={ centroidY - backgroundHeight / 2 }
									width={ backgroundWidth }
									height={ backgroundHeight }
									rx={ 4 }
									ry={ 4 }
									pointerEvents="none"
								/>
								<text
									className={ clsx(
										styles[ 'pie-chart__label-text' ],
										LABEL_TEXT_MODIFIER[
											pickLabelTextColor(
												accessors.fill( arcDatum.data ),
												labelRoles,
												'label-inverse'
											)
										]
									) }
									data-testid="pie-label"
									x={ centroidX }
									y={ centroidY }
									dy=".33em"
									fontSize={ fontSize }
									textAnchor="middle"
									pointerEvents="none"
								>
									{ arcDatum.data.label }
								</text>
							</g>
						);
					};

					return (
						<Center
							ref={ chartRef }
							className={ styles[ 'pie-chart__plot' ] }
							{ ...chartProps }
							aria-label={ ariaLabel ?? __( 'Pie chart', 'jetpack-charts' ) }
						>
							<svg
								ref={ svgRef }
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

								<Group top={ centerY } left={ centerX } mask={ wipeMask }>
									{ allSegmentsHidden ? (
										<SvgEmptyState x={ 0 } y={ 0 } width={ width } height={ height }>
											{ getAllHiddenMessage( legendInteractive, 'segments' ) }
										</SvgEmptyState>
									) : (
										arcs.map( ( arcDatum, index ) => (
											<g
												key={ `arc-${ index }` }
												{ ...getSegmentHandlers(
													arcDatum.data,
													navigationArcs.indexOf( arcDatum )
												) }
											>
												<path
													d={ path( arcDatum ) || '' }
													fill={ accessors.fill( arcDatum.data ) }
													data-testid="pie-segment"
												/>
											</g>
										) )
									) }
								</Group>
								{ /* Unmasked so the entry wipe cannot hide the focus indicator. */ }
								{ selectedArc && (
									<Group top={ centerY } left={ centerX }>
										<SelectedSegmentRing chartId={ chartId } d={ path( selectedArc ) || '' } />
									</Group>
								) }
								{ ! allSegmentsHidden && (
									<Group top={ centerY } left={ centerX } mask={ wipeMask }>
										{ showLabels && arcs.map( renderLabel ) }

										{ /* Render SVG children (like Group, Text) inside the SVG */ }
										{ svgChildren }
									</Group>
								) }
							</svg>
							<PieSelectionOutput
								{ ...outputProps }
								selectedData={ selectedArc?.data }
								keyboardTooltipAnchor={
									selectedArc &&
									getKeyboardTooltipAnchor( centerX, centerY, path.centroid( selectedArc ) )
								}
								renderTooltip={ renderTooltip }
							/>
						</Center>
					);
				} }
			</ChartLayout>
		</ChartInstanceContext.Provider>
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
