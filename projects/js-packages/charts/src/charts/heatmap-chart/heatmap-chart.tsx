import { formatNumber } from '@automattic/number-formatters';
import { HeatmapRect } from '@visx/heatmap';
import { scaleLinear } from '@visx/scale';
import { Text } from '@visx/text';
import { useTooltip, useTooltipInPortal } from '@visx/tooltip';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
	GlobalChartsProvider,
	useChartId,
	useGlobalChartsContext,
	useGlobalChartsTheme,
	GlobalChartsContext,
} from '../../providers';
import { attachSubComponents } from '../../utils';
import { lightenHexColor, normalizeColorToHex } from '../../utils/color-utils';
import { resolveCssVariable } from '../../utils/resolve-css-var';
import { Center } from '../private/center';
import { useChartChildren } from '../private/chart-composition';
import { ChartLayout } from '../private/chart-layout';
import { SingleChartContext } from '../private/single-chart-context';
import { withResponsive } from '../private/with-responsive';
import styles from './heatmap-chart.module.scss';
import {
	getValueExtent,
	createColorScale,
	getNormalizedValue,
	HeatmapLegend,
	isPresent,
} from './private';
import type { HeatmapChartProps, HeatmapColumn, HeatmapCell, HeatmapTooltipData } from './types';
import type { ResponsiveConfig } from '../private/with-responsive';
import type { FC } from 'react';

const DEFAULT_EMPTY_HEX = '#f0f0f0';

export type HeatmapContextValue = {
	extent: [ number, number ];
	fullColorHex: string;
	lightColorHex: string;
	emptyColorHex: string;
	colorFor: ( value: number ) => string;
};

export const HeatmapContext = createContext< HeatmapContextValue | null >( null );

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
	cellRadius,
	gap = 'md',
	withTooltips = false,
	renderTooltip,
	children,
} ) => {
	const chartId = useChartId( providedChartId );
	const { getElementStyles } = useGlobalChartsContext();
	const { heatmapChart: heatmapChartSettings } = useGlobalChartsTheme();
	const { nonLegendChildren } = useChartChildren( children, 'HeatmapChart' );

	const [ selectedIndex, setSelectedIndex ] = useState< number | undefined >();
	const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData, showTooltip, hideTooltip } =
		useTooltip< HeatmapTooltipData >();
	const { containerRef, containerBounds, TooltipInPortal } = useTooltipInPortal( {
		detectBounds: true,
		scroll: true,
	} );

	// The theme guarantees a defined primary (colors[0]); resolve any CSS-var token to hex.
	const fullColorHex = normalizeColorToHex(
		getElementStyles( { index: 0 } ).color,
		null,
		resolveCssVariable
	);
	const lightColorHex = lightenHexColor( fullColorHex, 0.8 );
	const emptyColorHex =
		normalizeColorToHex( heatmapChartSettings.emptyCellColor, null, resolveCssVariable ) ||
		DEFAULT_EMPTY_HEX;

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
	// Cell spacing/sizing come from the chart theme's heatmapChart section, so they
	// track the design system and stay overridable via GlobalChartsProvider.
	const {
		cellGap: themeCellGap,
		compactCellGap,
		valueFontSize,
		selectionStrokeWidth,
		selectionStrokeColor,
	} = heatmapChartSettings;
	const effectiveGap = cellGap ?? ( compact ? compactCellGap : themeCellGap );
	const effectiveRadius = cellRadius ?? heatmapChartSettings.cellRadius;
	const drawValues = showValues ?? ! compact;

	const onChartBlur = useCallback( () => {
		setSelectedIndex( undefined );
	}, [ setSelectedIndex ] );

	const onChartKeyDown = useCallback(
		( event: React.KeyboardEvent< HTMLDivElement > ) => {
			if (
				! [ 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Escape', 'Tab' ].includes(
					event.key
				)
			) {
				return;
			}

			if ( event.key === 'Tab' ) {
				setSelectedIndex( undefined );
				return;
			}

			if ( event.key === 'Escape' ) {
				setSelectedIndex( undefined );
				return;
			}

			event.preventDefault();

			if ( selectedIndex === undefined ) {
				setSelectedIndex( 0 );
				return;
			}

			let col = Math.floor( selectedIndex / rows );
			let row = selectedIndex % rows;

			if ( event.key === 'ArrowRight' ) {
				col = Math.min( col + 1, columns - 1 );
			} else if ( event.key === 'ArrowLeft' ) {
				col = Math.max( col - 1, 0 );
			} else if ( event.key === 'ArrowDown' ) {
				row = Math.min( row + 1, rows - 1 );
			} else if ( event.key === 'ArrowUp' ) {
				row = Math.max( row - 1, 0 );
			}

			setSelectedIndex( col * rows + row );
		},
		[ rows, columns, selectedIndex, setSelectedIndex ]
	);

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
					{ info.value === null ? __( 'No data', 'jetpack-charts' ) : formatNumber( info.value ) }
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
			// TooltipInPortal re-adds containerBounds, so subtract it to land at the cursor.
			showTooltip( {
				tooltipLeft: event.clientX - containerBounds.left,
				tooltipTop: event.clientY - containerBounds.top,
				tooltipData: buildTooltipData( columnIndex, rowIndex ),
			} );
		},
		[ withTooltips, showTooltip, buildTooltipData, containerBounds ]
	);

	const handleCellMouseLeave = useCallback( () => {
		if ( withTooltips ) {
			hideTooltip();
		}
	}, [ withTooltips, hideTooltip ] );

	// Size the SVG to the measured content slot (which flexes to leave room for a
	// trailing legend), rather than the full container height. Mirrors bar-chart.
	const [ measuredChartHeight, setMeasuredChartHeight ] = useState< number | undefined >();
	const handleContentHeightChange = useCallback(
		( contentHeight: number ) => {
			setMeasuredChartHeight( contentHeight > 0 ? contentHeight : height );
		},
		[ height ]
	);

	if ( ! columns || ! rows ) {
		return (
			<Center
				className={ clsx( 'heatmap-chart', styles[ 'heatmap-chart' ], className ) }
				style={ { width, height } }
				data-testid="heatmap-chart"
			>
				<span className={ styles[ 'heatmap-chart__empty' ] }>
					{ __( 'No data available', 'jetpack-charts' ) }
				</span>
			</Center>
		);
	}

	const defaultMargin = {
		// Top band must fit the 12px column label (rendered at y=-6) — same in compact.
		top: 20,
		right: 0,
		bottom: 0,
		left: 36,
		...margin,
	};

	return (
		<HeatmapContext.Provider value={ heatmapContext }>
			<SingleChartContext.Provider
				value={ { chartId, chartWidth: width, chartHeight: measuredChartHeight || 0 } }
			>
				<ChartLayout
					legendPosition="bottom"
					// HeatmapLegend renders via trailingContent (useChartChildren doesn't classify it as a slot legend).
					legendChildren={ [] }
					trailingContent={ nonLegendChildren }
					onContentHeightChange={ handleContentHeightChange }
					gap={ gap }
					className={ clsx( 'heatmap-chart', styles[ 'heatmap-chart' ], className ) }
					style={ { width, height } }
					data-testid="heatmap-chart"
					data-chart-id={ `heatmap-chart-${ chartId }` }
				>
					{ ( { contentHeight } ) => {
						const chartHeight = contentHeight > 0 ? contentHeight : height;
						const innerWidth = Math.max( 0, width - defaultMargin.left - defaultMargin.right );
						const innerHeight = Math.max(
							0,
							chartHeight - defaultMargin.top - defaultMargin.bottom
						);
						// Non-compact fills the area (rectangular cells). Compact uses square
						// cells sized to fit both axes, matching the contribution-graph design.
						let binWidth = innerWidth / columns;
						let binHeight = innerHeight / rows;
						if ( compact ) {
							const cellSize = Math.min( binWidth, binHeight );
							binWidth = cellSize;
							binHeight = cellSize;
						}
						const xScale = scaleLinear< number >( {
							domain: [ 0, columns ],
							range: [ 0, binWidth * columns ],
						} );
						const yScale = scaleLinear< number >( {
							domain: [ 0, rows ],
							range: [ 0, binHeight * rows ],
						} );

						// Keyboard navigation drives the tooltip too: when a cell is selected via
						// the arrow keys, show its tooltip at the cell (mirrors mouse hover and how
						// bar/line charts surface the tooltip on keyboard focus).
						const keyboardTooltip =
							selectedIndex !== undefined
								? {
										top: defaultMargin.top + yScale( selectedIndex % rows ),
										left:
											defaultMargin.left +
											xScale( Math.floor( selectedIndex / rows ) ) +
											binWidth / 2,
										data: buildTooltipData(
											Math.floor( selectedIndex / rows ),
											selectedIndex % rows
										),
								  }
								: null;
						const activeTooltip =
							keyboardTooltip ??
							( tooltipOpen && tooltipData
								? { top: tooltipTop, left: tooltipLeft, data: tooltipData }
								: null );

						return (
							<div
								role="grid"
								aria-label={ __( 'Heatmap chart', 'jetpack-charts' ) }
								aria-rowcount={ rows }
								aria-colcount={ columns }
								aria-activedescendant={
									selectedIndex !== undefined
										? `${ chartId }-cell-${ Math.floor( selectedIndex / rows ) }-${
												selectedIndex % rows
										  }`
										: undefined
								}
								tabIndex={ 0 }
								onBlur={ onChartBlur }
								onKeyDown={ onChartKeyDown }
							>
								{ width > 0 && chartHeight > 0 && (
									<svg ref={ containerRef } width={ width } height={ chartHeight }>
										<g transform={ `translate(${ defaultMargin.left }, ${ defaultMargin.top })` }>
											{ data.map( ( column, columnIndex ) => {
												if ( ! column.label ) {
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
												{ heatmap => {
													const numCols = heatmap.length;
													const numRows = heatmap[ 0 ]?.length ?? 0;
													return Array.from( { length: numRows } ).map( ( _v, r ) => (
														<g role="row" key={ `row-${ r }` } aria-rowindex={ r + 1 }>
															{ Array.from( { length: numCols } ).map( ( _w, c ) => {
																const cell = heatmap[ c ][ r ];
																if ( ! cell ) {
																	return null;
																}
																const value = ( cell.bin as HeatmapCell ).value;
																const present = isPresent( value );
																const cellFlatIndex = cell.column * rows + cell.row;
																const info = buildTooltipData( cell.column, cell.row );
																const accessibleName =
																	info.cellLabel ||
																	`${ info.columnLabel ?? '' } ${ info.rowLabel ?? '' }`.trim();
																const titleText = `${ accessibleName }: ${
																	info.value === null
																		? __( 'No data', 'jetpack-charts' )
																		: formatNumber( info.value )
																}`;

																return (
																	<g
																		key={ `${ c }-${ r }` }
																		id={ `${ chartId }-cell-${ c }-${ r }` }
																		role="gridcell"
																		aria-colindex={ c + 1 }
																		aria-label={ titleText }
																		data-column={ cell.column }
																		data-row={ cell.row }
																		onMouseMove={ handleCellMouseMove }
																		onMouseLeave={ handleCellMouseLeave }
																	>
																		<rect
																			data-testid="heatmap-cell"
																			x={ cell.x }
																			y={ cell.y }
																			width={ cell.width }
																			height={ cell.height }
																			rx={ effectiveRadius }
																			fill={ present ? colorFor( value as number ) : emptyColorHex }
																			stroke={
																				selectedIndex === cellFlatIndex
																					? selectionStrokeColor
																					: 'none'
																			}
																			strokeWidth={ selectionStrokeWidth }
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
																						: 'var(--wpds-color-fg-content-neutral, #1e1e1e)'
																				}
																				fontSize={ valueFontSize }
																			>
																				{ formatNumber( value ) }
																			</Text>
																		) }
																	</g>
																);
															} ) }
														</g>
													) );
												} }
											</HeatmapRect>
										</g>
									</svg>
								) }
								{ withTooltips && activeTooltip && (
									<TooltipInPortal top={ activeTooltip.top } left={ activeTooltip.left }>
										<div role="tooltip" tabIndex={ -1 }>
											{ ( renderTooltip ?? defaultRenderTooltip )( activeTooltip.data ) }
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
