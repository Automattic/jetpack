import { HeatmapRect } from '@visx/heatmap';
import { scaleLinear } from '@visx/scale';
import { Text } from '@visx/text';
import { useTooltip, useTooltipInPortal } from '@visx/tooltip';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useKeyboardNavigation } from '../../components/tooltip';
import {
	GlobalChartsProvider,
	useChartId,
	useGlobalChartsContext,
	GlobalChartsContext,
} from '../../providers';
import { attachSubComponents } from '../../utils';
import { lightenHexColor, normalizeColorToHex, isValidHexColor } from '../../utils/color-utils';
import { resolveCssVariable } from '../../utils/resolve-css-var';
import { useChartChildren } from '../private/chart-composition';
import { ChartLayout } from '../private/chart-layout';
import { SingleChartContext } from '../private/single-chart-context';
import { withResponsive } from '../private/with-responsive';
import styles from './heatmap-chart.module.scss';
import {
	getValueExtent,
	createColorScale,
	getNormalizedValue,
	EMPTY_CELL_COLOR,
	HeatmapLegend,
} from './private';
import type { HeatmapChartProps, HeatmapColumn, HeatmapCell, HeatmapTooltipData } from './types';
import type { ResponsiveConfig } from '../private/with-responsive';
import type { FC } from 'react';

const DEFAULT_PRIMARY_HEX = '#006dab';
const DEFAULT_EMPTY_HEX = '#f6f7f7';

export type HeatmapContextValue = {
	extent: [ number, number ];
	fullColorHex: string;
	lightColorHex: string;
	emptyColorHex: string;
	colorFor: ( value: number ) => string;
};

export const HeatmapContext = createContext< HeatmapContextValue | null >( null );

const DEFAULT_GAP = 4;
const COMPACT_GAP = 2;
const isPresent = ( v: number | null | undefined ): v is number =>
	v !== null && v !== undefined && ! isNaN( v );

const getBins = ( column: HeatmapColumn ): HeatmapCell[] => column.data;
const getCount = ( cell: HeatmapCell ): number =>
	isPresent( cell.value ) ? ( cell.value as number ) : 0;

const HeatmapChartInternal: FC< HeatmapChartProps > = ( {
	data,
	chartId: providedChartId,
	width = 0,
	height = 0,
	className,
	margin,
	compact = false,
	showValues,
	rowLabels = [],
	cellGap,
	cellRadius = 2,
	gap = 'md',
	withTooltips = false,
	renderTooltip,
	children,
} ) => {
	const chartId = useChartId( providedChartId );
	const { getElementStyles } = useGlobalChartsContext();
	const { nonLegendChildren } = useChartChildren( children, 'HeatmapChart' );

	const chartRef = useRef< HTMLDivElement >( null );
	const [ selectedIndex, setSelectedIndex ] = useState< number | undefined >();
	const [ isNavigating, setIsNavigating ] = useState( false );
	const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData, showTooltip, hideTooltip } =
		useTooltip< HeatmapTooltipData >();
	const { containerRef, TooltipInPortal } = useTooltipInPortal( {
		detectBounds: true,
		scroll: true,
	} );

	const rawPrimary = normalizeColorToHex(
		getElementStyles( { index: 0 } ).color,
		null,
		resolveCssVariable
	);
	const fullColorHex = isValidHexColor( rawPrimary ) ? rawPrimary : DEFAULT_PRIMARY_HEX;
	const lightColorHex = lightenHexColor( fullColorHex, 0.8 );
	const emptyColorHex =
		normalizeColorToHex( EMPTY_CELL_COLOR, null, resolveCssVariable ) || DEFAULT_EMPTY_HEX;

	const extent = useMemo( () => getValueExtent( data ), [ data ] );
	const colorFor = useMemo(
		() => createColorScale( extent, lightColorHex, fullColorHex ),
		[ extent, lightColorHex, fullColorHex ]
	);

	const heatmapContext = useMemo< HeatmapContextValue >(
		() => ( { extent, fullColorHex, lightColorHex, emptyColorHex, colorFor } ),
		[ extent, fullColorHex, lightColorHex, emptyColorHex, colorFor ]
	);

	const columns = data.length;
	const rows = Math.max( 0, ...data.map( column => column.data.length ) );
	const effectiveGap = cellGap ?? ( compact ? COMPACT_GAP : DEFAULT_GAP );
	const drawValues = showValues ?? ! compact;

	const totalPoints = columns * rows;
	const { tooltipRef, onChartFocus, onChartBlur, onChartKeyDown } = useKeyboardNavigation( {
		selectedIndex,
		setSelectedIndex,
		isNavigating,
		setIsNavigating,
		chartRef,
		totalPoints,
	} );

	const buildTooltipData = useCallback(
		( columnIndex: number, rowIndex: number ): HeatmapTooltipData => {
			const cell = data[ columnIndex ]?.data[ rowIndex ];
			return {
				value: cell?.value ?? null,
				rowLabel: rowLabels[ rowIndex ],
				columnLabel: data[ columnIndex ]?.label,
				cellLabel: cell?.label,
				row: rowIndex,
				column: columnIndex,
			};
		},
		[ data, rowLabels ]
	);

	const defaultRenderTooltip = useCallback(
		( info: HeatmapTooltipData ) => (
			<div>
				<strong>
					{ info.cellLabel || `${ info.columnLabel ?? '' } ${ info.rowLabel ?? '' }`.trim() }
				</strong>
				<div>
					{ info.value === null ? __( 'No data', 'jetpack-charts' ) : String( info.value ) }
				</div>
			</div>
		),
		[]
	);

	const handleCellMouseMove = useCallback(
		( event: React.MouseEvent< SVGGElement > ) => {
			if ( ! withTooltips ) {
				return;
			}
			const target = event.currentTarget as SVGGElement;
			const columnIndex = Number( target.dataset.column );
			const rowIndex = Number( target.dataset.row );
			showTooltip( {
				tooltipLeft: event.clientX,
				tooltipTop: event.clientY,
				tooltipData: buildTooltipData( columnIndex, rowIndex ),
			} );
		},
		[ withTooltips, showTooltip, buildTooltipData ]
	);

	const handleCellMouseLeave = useCallback( () => {
		if ( withTooltips ) {
			hideTooltip();
		}
	}, [ withTooltips, hideTooltip ] );

	if ( ! columns || ! rows ) {
		return (
			<div className={ clsx( 'heatmap-chart', styles[ 'heatmap-chart' ], className ) }>
				<div className={ styles[ 'heatmap-chart__empty' ] }>
					{ __( 'No data available', 'jetpack-charts' ) }
				</div>
			</div>
		);
	}

	const defaultMargin = {
		top: compact ? 14 : 20,
		right: 0,
		bottom: 0,
		left: 36,
		...margin,
	};

	return (
		<HeatmapContext.Provider value={ heatmapContext }>
			<SingleChartContext.Provider value={ { chartId, chartWidth: width, chartHeight: height } }>
				<ChartLayout
					legendPosition="bottom"
					// HeatmapLegend renders via trailingContent (useChartChildren doesn't classify it as a slot legend).
					legendChildren={ [] }
					trailingContent={ nonLegendChildren }
					gap={ gap }
					className={ clsx( 'heatmap-chart', styles[ 'heatmap-chart' ], className ) }
					style={ { width, height } }
					data-testid="heatmap-chart"
					data-chart-id={ `heatmap-chart-${ chartId }` }
				>
					{ () => {
						const innerWidth = Math.max( 0, width - defaultMargin.left - defaultMargin.right );
						const innerHeight = Math.max( 0, height - defaultMargin.top - defaultMargin.bottom );
						const binWidth = innerWidth / columns;
						const binHeight = innerHeight / rows;
						const xScale = scaleLinear< number >( {
							domain: [ 0, columns ],
							range: [ 0, innerWidth ],
						} );
						const yScale = scaleLinear< number >( {
							domain: [ 0, rows ],
							range: [ 0, innerHeight ],
						} );

						return (
							<div
								ref={ chartRef }
								role="grid"
								aria-label={ __( 'Heatmap chart', 'jetpack-charts' ) }
								tabIndex={ 0 }
								onFocus={ onChartFocus }
								onBlur={ onChartBlur }
								onKeyDown={ onChartKeyDown }
							>
								{ width > 0 && height > 0 && (
									<svg ref={ containerRef } width={ width } height={ height }>
										<g transform={ `translate(${ defaultMargin.left }, ${ defaultMargin.top })` }>
											{ data.map( ( column, columnIndex ) => {
												const visible = ! compact || columnIndex % 2 === 0;
												if ( ! column.label || ! visible ) {
													return null;
												}
												return (
													<Text
														key={ `col-${ columnIndex }` }
														className={ styles[ 'heatmap-chart__axis-label' ] }
														x={ xScale( columnIndex ) }
														y={ -6 }
														verticalAnchor="end"
														textAnchor="start"
													>
														{ column.label }
													</Text>
												);
											} ) }

											{ rowLabels.map( ( label, rowIndex ) => {
												const visible = ! compact || rowIndex % 2 === 0;
												if ( ! label || ! visible ) {
													return null;
												}
												return (
													<Text
														key={ `row-${ rowIndex }` }
														className={ styles[ 'heatmap-chart__axis-label' ] }
														x={ -8 }
														y={ yScale( rowIndex ) + binHeight / 2 }
														verticalAnchor="middle"
														textAnchor="end"
													>
														{ label }
													</Text>
												);
											} ) }

											<HeatmapRect
												data={ data }
												xScale={ xScale }
												yScale={ yScale }
												binWidth={ binWidth }
												binHeight={ binHeight }
												gap={ effectiveGap }
												bins={ getBins }
												count={ getCount }
											>
												{ heatmap =>
													heatmap.map( columnCells =>
														columnCells.map( cell => {
															const value = ( cell.bin as { value: number | null } ).value;
															const present = isPresent( value );
															const cellFlatIndex = cell.column * rows + cell.row;
															const info = buildTooltipData( cell.column, cell.row );
															const accessibleName =
																info.cellLabel ||
																`${ info.columnLabel ?? '' } ${ info.rowLabel ?? '' }`.trim();
															const titleText = `${ accessibleName }: ${
																info.value === null ? __( 'No data', 'jetpack-charts' ) : info.value
															}`;

															return (
																<g
																	key={ `${ cell.column }-${ cell.row }` }
																	role="gridcell"
																	data-column={ cell.column }
																	data-row={ cell.row }
																	onMouseMove={ handleCellMouseMove }
																	onMouseLeave={ handleCellMouseLeave }
																>
																	<title>{ titleText }</title>
																	<rect
																		data-testid="heatmap-cell"
																		x={ cell.x }
																		y={ cell.y }
																		width={ cell.width }
																		height={ cell.height }
																		rx={ cellRadius }
																		fill={ present ? colorFor( value as number ) : emptyColorHex }
																		stroke={ selectedIndex === cellFlatIndex ? '#005fcc' : 'none' }
																		strokeWidth={ 2 }
																	/>
																	{ drawValues && present && (
																		<Text
																			x={ cell.x + cell.width / 2 }
																			y={ cell.y + cell.height / 2 }
																			textAnchor="middle"
																			verticalAnchor="middle"
																			fill={
																				getNormalizedValue( value as number, extent ) > 0.5
																					? '#ffffff'
																					: 'var(--jp-gray-80, #2c3338)'
																			}
																			fontSize={ 11 }
																		>
																			{ String( value ) }
																		</Text>
																	) }
																</g>
															);
														} )
													)
												}
											</HeatmapRect>
										</g>
									</svg>
								) }
								{ withTooltips && tooltipOpen && tooltipData && (
									<TooltipInPortal top={ tooltipTop } left={ tooltipLeft }>
										<div role="tooltip" ref={ tooltipRef } tabIndex={ -1 }>
											{ ( renderTooltip ?? defaultRenderTooltip )( tooltipData ) }
										</div>
									</TooltipInPortal>
								) }
							</div>
						);
					} }
				</ChartLayout>
			</SingleChartContext.Provider>
		</HeatmapContext.Provider>
	);
};

const HeatmapChartWithProvider: FC< HeatmapChartProps > = props => {
	const existingContext = useContext( GlobalChartsContext );
	if ( existingContext ) {
		return <HeatmapChartInternal { ...props } />;
	}
	return (
		<GlobalChartsProvider>
			<HeatmapChartInternal { ...props } />
		</GlobalChartsProvider>
	);
};

HeatmapChartWithProvider.displayName = 'HeatmapChart';

interface HeatmapChartSubComponents {
	Legend: typeof HeatmapLegend;
}

const HeatmapChart = attachSubComponents( HeatmapChartWithProvider, {
	Legend: HeatmapLegend,
} ) as FC< HeatmapChartProps > & HeatmapChartSubComponents;

const HeatmapChartResponsive = attachSubComponents(
	withResponsive< HeatmapChartProps >( HeatmapChartWithProvider ),
	{ Legend: HeatmapLegend }
) as FC< HeatmapChartProps & ResponsiveConfig > & HeatmapChartSubComponents;

export { HeatmapChartResponsive as default, HeatmapChart as HeatmapChartUnresponsive };
