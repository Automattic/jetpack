import { formatNumber, formatNumberCompact } from '@automattic/number-formatters';
import { useTooltip, useTooltipInPortal } from '@visx/tooltip';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
	GlobalChartsProvider,
	useChartId,
	useChartScopeElement,
	useGlobalChartsContext,
	GlobalChartsContext,
} from '../../providers';
import { CHART_SCOPE_CLASS } from '../../styles/chart-scope-class';
import { attachSubComponents } from '../../utils';
import {
	isValidHexColor,
	mixHexColors,
	normalizeColorToHex,
	prefersLightText,
} from '../../utils/color-utils';
import { resolveCssVariable } from '../../utils/resolve-css-var';
import { Center } from '../private/center';
import { useChartChildren } from '../private/chart-composition';
import { ChartInstanceContext } from '../private/chart-instance-context';
import { ChartLayout } from '../private/chart-layout';
import { withResponsive } from '../private/with-responsive';
import styles from './heatmap-chart.module.scss';
import {
	getValueExtent,
	getNormalizedValue,
	HeatmapContext,
	HeatmapLegend,
	isPresent,
} from './private';
import type { HeatmapContextValue } from './private';
import type { HeatmapChartProps, HeatmapColumn, HeatmapTooltipData } from './types';
import type { ResponsiveConfig } from '../private/with-responsive';
import type { CSSProperties, FC } from 'react';

// Mirrors the color-mix floor in heatmap-chart.module.scss (.heatmap-chart__cell--filled):
// the rendered fill is the primary mixed over the chart background at 0.15 + 0.85 * intensity.
const CELL_MIX_FLOOR = 0.15;

const HeatmapChartInternal: FC< HeatmapChartProps > = ( {
	data,
	chartId: providedChartId,
	width = 0,
	height = 0,
	className,
	compact = false,
	showValues,
	maxCellWidth,
	maxCellHeight,
	minCellWidth,
	minCellHeight,
	rowLabels = [],
	trailingColumn,
	columnLabelAlign = 'start',
	stickyLabels = false,
	primaryColor,
	gap = 'md',
	withTooltips = false,
	renderTooltip,
	children,
} ) => {
	const chartId = useChartId( providedChartId );
	const { getElementStyles, theme } = useGlobalChartsContext();
	const scopeElement = useChartScopeElement();
	const { heatmapChart: heatmapChartSettings } = theme;
	const { nonLegendChildren } = useChartChildren( children, 'HeatmapChart' );

	const [ selectedIndex, setSelectedIndex ] = useState< number | undefined >();
	const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData, showTooltip, hideTooltip } =
		useTooltip< HeatmapTooltipData >();
	const { containerRef, containerBounds, TooltipInPortal } = useTooltipInPortal( {
		detectBounds: true,
		scroll: true,
	} );
	// Read from a ref so the keyboard-tooltip effect doesn't depend on containerBounds, which
	// is a new object each render and would loop the effect via showTooltip.
	const containerBoundsRef = useRef( containerBounds );
	containerBoundsRef.current = containerBounds;

	const { color: primaryColorHex } = getElementStyles( {
		index: 0,
		overrideColor: primaryColor || heatmapChartSettings.primaryColor,
	} );

	// Resolve the background against this chart's own scope element (not the provider's), matching where `--a8c-charts-color-heatmap-background` is substituted for the cell blend below — a chart-level override otherwise disagrees with a provider-level read.
	const chartBackgroundHex = normalizeColorToHex(
		theme.backgroundColor,
		scopeElement,
		resolveCssVariable
	);

	// Choose text color from the blended fill, not the raw value.
	// If either color cannot resolve to hex, keep dark text.
	const primaryHex = normalizeColorToHex( primaryColorHex );
	const cellHasLightText = ( intensity: number ): boolean =>
		isValidHexColor( primaryHex ) &&
		isValidHexColor( chartBackgroundHex ) &&
		prefersLightText(
			mixHexColors(
				primaryHex,
				chartBackgroundHex,
				1 - ( CELL_MIX_FLOOR + ( 1 - CELL_MIX_FLOOR ) * intensity )
			)
		);

	const extent = useMemo( () => getValueExtent( data ), [ data ] );
	const heatmapContext = useMemo< HeatmapContextValue >(
		() => ( { extent, primaryColorHex } ),
		[ extent, primaryColorHex ]
	);

	const dataColumns = data.length;
	const rows = Math.max( 0, ...data.map( column => column.data.length ) );

	// The trailing column joins the grid as one more column so navigation,
	// tooltips and ARIA treat it like any other; only the scale above and the
	// fill below leave it out. Sized to the row count so a short or long
	// summary array cannot ragged-edge the grid.
	const columnsData = useMemo< HeatmapColumn[] >(
		() =>
			trailingColumn
				? [
						...data,
						{
							label: trailingColumn.label,
							data: Array.from( { length: rows }, ( _cell, rowIndex ) => {
								const value = trailingColumn.data[ rowIndex ] ?? null;

								// Hidden when there is nothing to roll up, matching what a data
								// column does with a missing value: an empty slot that keeps its
								// place and that hover and keyboard navigation skip, rather than
								// a stop that announces "No data".
								return value === null ? { value, hidden: true } : { value };
							} ),
						},
				  ]
				: data,
		[ data, trailingColumn, rows ]
	);
	const trailingColumnIndex = trailingColumn ? dataColumns : -1;
	const columns = columnsData.length;

	const { compactCellGap, compactCellSize } = heatmapChartSettings;
	const drawValues = showValues ?? ! compact;

	const buildTooltipData = useCallback(
		( columnIndex: number, rowIndex: number ): HeatmapTooltipData => {
			const cell = columnsData[ columnIndex ]?.data[ rowIndex ];
			return {
				value: cell?.value ?? null,
				rowLabel: rowLabels[ rowIndex ],
				columnLabel: columnsData[ columnIndex ]?.label,
				cellLabel: cell?.label,
				row: rowIndex,
				column: columnIndex,
			};
		},
		[ columnsData, rowLabels ]
	);

	const onChartBlur = useCallback( () => {
		setSelectedIndex( undefined );
		hideTooltip();
	}, [ hideTooltip ] );

	// Both empty-slot kinds are skipped by navigation: `hidden` paints nothing,
	// `placeholder` paints an empty cell, and neither has a value to report.
	const isCellInert = useCallback(
		( col: number, row: number ) => {
			const cell = columnsData[ col ]?.data[ row ];
			return cell?.hidden === true || cell?.placeholder === true;
		},
		[ columnsData ]
	);

	const onChartKeyDown = useCallback(
		( event: React.KeyboardEvent< HTMLDivElement > ) => {
			if (
				! [ 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Escape', 'Tab' ].includes(
					event.key
				)
			) {
				return;
			}

			if ( event.key === 'Tab' || event.key === 'Escape' ) {
				setSelectedIndex( undefined );
				hideTooltip();
				return;
			}

			event.preventDefault();

			if ( selectedIndex === undefined ) {
				// Start at the first navigable cell (a calendar's leading edge
				// slots may be hidden).
				for ( let index = 0; index < columns * rows; index++ ) {
					if ( ! isCellInert( Math.floor( index / rows ), index % rows ) ) {
						setSelectedIndex( index );
						return;
					}
				}
				return;
			}

			let stepCol = 0;
			let stepRow = 0;
			if ( event.key === 'ArrowRight' ) {
				stepCol = 1;
			} else if ( event.key === 'ArrowLeft' ) {
				stepCol = -1;
			} else if ( event.key === 'ArrowDown' ) {
				stepRow = 1;
			} else if ( event.key === 'ArrowUp' ) {
				stepRow = -1;
			}

			// Step past hidden slots to the next navigable cell in the pressed
			// direction; when only hidden slots (or the edge) remain that way,
			// the selection stays put.
			let col = Math.floor( selectedIndex / rows );
			let row = selectedIndex % rows;
			do {
				col += stepCol;
				row += stepRow;
			} while ( col >= 0 && col < columns && row >= 0 && row < rows && isCellInert( col, row ) );

			if ( col < 0 || col >= columns || row < 0 || row >= rows ) {
				return;
			}

			setSelectedIndex( col * rows + row );
		},
		[ rows, columns, selectedIndex, hideTooltip, isCellInert ]
	);

	const handleCellMouseMove = useCallback(
		( event: React.MouseEvent< HTMLDivElement > ) => {
			if ( ! withTooltips ) {
				return;
			}
			const target = event.currentTarget;
			const columnIndex = Number( target.dataset.column );
			const rowIndex = Number( target.dataset.row );
			// Read bounds from the ref (like the keyboard-tooltip effect) so this
			// callback stays stable across renders.
			const bounds = containerBoundsRef.current;
			// TooltipInPortal re-adds containerBounds, so subtract it to land at the cursor.
			showTooltip( {
				tooltipLeft: event.clientX - bounds.left,
				tooltipTop: event.clientY - bounds.top,
				tooltipData: buildTooltipData( columnIndex, rowIndex ),
			} );
		},
		[ withTooltips, showTooltip, buildTooltipData ]
	);

	const handleCellMouseLeave = useCallback( () => {
		// Keyboard selection owns the tooltip; don't let a mouse-out clear it.
		if ( withTooltips && selectedIndex === undefined ) {
			hideTooltip();
		}
	}, [ withTooltips, selectedIndex, hideTooltip ] );

	// Keyboard focus stays on the grid (the `aria-activedescendant` pattern), so
	// the browser never scrolls the selection into view the way it would for a
	// really-focused element. Inside a scrolling container the selection would
	// otherwise walk off the scrollport with nothing visibly happening. Not
	// gated on `withTooltips`: navigation has to stay visible either way.
	useEffect( () => {
		if ( selectedIndex === undefined || typeof document === 'undefined' ) {
			return;
		}

		const col = Math.floor( selectedIndex / rows );
		const row = selectedIndex % rows;

		// Optional call: jsdom leaves `scrollIntoView` undefined.
		document
			.getElementById( `${ chartId }-cell-${ col }-${ row }` )
			?.scrollIntoView?.( { block: 'nearest', inline: 'nearest' } );
	}, [ selectedIndex, rows, chartId ] );

	// Anchor the tooltip at the selected cell's center on keyboard nav. Cleared on blur/Escape,
	// not here, so a mouse hover (no selection) isn't affected.
	useEffect( () => {
		if ( ! withTooltips || selectedIndex === undefined ) {
			return;
		}
		const col = Math.floor( selectedIndex / rows );
		const row = selectedIndex % rows;
		const cell =
			typeof document !== 'undefined'
				? document.getElementById( `${ chartId }-cell-${ col }-${ row }` )
				: null;
		const rect = cell?.getBoundingClientRect();
		const bounds = containerBoundsRef.current;
		showTooltip( {
			tooltipLeft: rect ? rect.left + rect.width / 2 - bounds.left : 0,
			tooltipTop: rect ? rect.top + rect.height / 2 - bounds.top : 0,
			tooltipData: buildTooltipData( col, row ),
		} );
	}, [ selectedIndex, withTooltips, rows, chartId, buildTooltipData, showTooltip ] );

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

	if ( ! columns || ! rows ) {
		return (
			<Center
				className={ clsx( 'heatmap-chart', styles[ 'heatmap-chart' ], className ) }
				style={ { width: width || undefined, height: height || undefined } }
				data-testid="heatmap-chart"
			>
				<span className={ styles[ 'heatmap-chart__empty' ] }>
					{ __( 'No data available', 'jetpack-charts' ) }
				</span>
			</Center>
		);
	}

	// Non-compact tracks split the container by default; a max cap makes them
	// stop growing there instead, so sparse ranges keep sensible cell sizes,
	// and a min floor makes the grid overflow (for a scrollable wrapper)
	// rather than crushing cells on long ranges.
	const columnTrack = compact
		? 'var(--a8c-charts-dimension-heatmap-cell-size)'
		: `minmax(${ minCellWidth ?? 0 }px, ${ maxCellWidth ? `${ maxCellWidth }px` : '1fr' })`;
	const rowTrack = compact
		? 'var(--a8c-charts-dimension-heatmap-cell-size)'
		: `minmax(${ minCellHeight ?? 0 }px, ${ maxCellHeight ? `${ maxCellHeight }px` : '1fr' })`;
	const gridStyle: Record< string, string | number > = {
		'--a8c-charts-color-heatmap-primary': primaryColorHex,
		'--a8c-charts-color-heatmap-background': theme.backgroundColor,
		// The trailing column sits on its own `auto` track: it holds a roll-up an
		// order of magnitude wider than a cell, and sharing the data columns'
		// track would size all of them to it.
		gridTemplateColumns: `auto repeat(${ dataColumns }, ${ columnTrack })${
			trailingColumn ? ' auto' : ''
		}`,
		gridTemplateRows: `auto repeat(${ rows }, ${ rowTrack })`,
	};
	if ( compact ) {
		gridStyle[ '--a8c-charts-dimension-heatmap-cell-gap' ] = `${ compactCellGap }px`;
		gridStyle[ '--a8c-charts-dimension-heatmap-cell-size' ] = `${ compactCellSize }px`;
	}

	const activeDescendant =
		selectedIndex !== undefined
			? `${ chartId }-cell-${ Math.floor( selectedIndex / rows ) }-${ selectedIndex % rows }`
			: undefined;

	// A capped row track makes the chart content-sized vertically: neither the
	// wrapper nor the grid stretches, or the leftover container height would
	// land in the auto label row. A width-only cap must keep the normal vertical
	// flex sizing, so it does not opt into this class.
	const heightCapped = ! compact && Boolean( maxCellHeight );

	return (
		<HeatmapContext.Provider value={ heatmapContext }>
			<ChartInstanceContext.Provider value={ { chartId } }>
				<ChartLayout
					legendPosition="bottom"
					// Legend renders via trailingContent, not the legend slot.
					legendChildren={ [] }
					trailingContent={ nonLegendChildren }
					gap={ gap }
					className={ clsx( 'heatmap-chart', styles[ 'heatmap-chart' ], className, {
						[ styles[ 'heatmap-chart--height-capped' ] ]: heightCapped,
					} ) }
					// Explicit dimensions (the unresponsive export) pin the size; otherwise
					// width/height are unset and the grid fills its container via CSS. The
					// responsive export drops the measured pixels so reflow stays fluid.
					style={ { width: width || undefined, height: height || undefined } }
					data-testid="heatmap-chart"
					data-chart-id={ `heatmap-chart-${ chartId }` }
				>
					<div
						ref={ containerRef }
						role="grid"
						aria-label={ __( 'Heatmap chart', 'jetpack-charts' ) }
						aria-rowcount={ rows }
						aria-colcount={ columns }
						aria-activedescendant={ activeDescendant }
						tabIndex={ 0 }
						onBlur={ onChartBlur }
						onKeyDown={ onChartKeyDown }
						className={ clsx( styles[ 'heatmap-chart__grid' ], {
							[ styles[ 'heatmap-chart__grid--compact' ] ]: compact,
							[ styles[ 'heatmap-chart__grid--height-capped' ] ]: heightCapped,
						} ) }
						style={ gridStyle as CSSProperties }
					>
						{ /* Header row preserves the grid structure; cell aria-labels include this text. */ }
						<div role="row" aria-hidden="true" className={ styles[ 'heatmap-chart__row' ] }>
							{ /* The corner sits where the two pinned axes cross, so it pins on
							     both and above them — otherwise a row label slides under it. */ }
							<span
								className={ clsx( {
									[ styles[ 'heatmap-chart__corner' ] ]: stickyLabels,
								} ) }
							/>
							{ columnsData.map( ( column, columnIndex ) => (
								<span
									key={ `col-${ columnIndex }` }
									className={ clsx( styles[ 'heatmap-chart__col-label' ], {
										[ styles[ 'heatmap-chart__col-label--center' ] ]: columnLabelAlign === 'center',
										[ styles[ 'heatmap-chart__label--sticky' ] ]: stickyLabels,
										[ styles[ 'heatmap-chart__col-label--sticky' ] ]: stickyLabels,
									} ) }
								>
									{ column.label }
								</span>
							) ) }
						</div>

						{ Array.from( { length: rows } ).map( ( _row, rowIndex ) => {
							const labelVisible = ! compact || rowIndex % 2 === 0;
							return (
								<div
									key={ `row-${ rowIndex }` }
									role="row"
									aria-rowindex={ rowIndex + 1 }
									className={ styles[ 'heatmap-chart__row' ] }
								>
									<span
										aria-hidden="true"
										className={ clsx( styles[ 'heatmap-chart__row-label' ], {
											[ styles[ 'heatmap-chart__label--sticky' ] ]: stickyLabels,
											[ styles[ 'heatmap-chart__row-label--sticky' ] ]: stickyLabels,
										} ) }
									>
										{ labelVisible ? rowLabels[ rowIndex ] ?? '' : '' }
									</span>
									{ columnsData.map( ( column, columnIndex ) => {
										const cell = column.data[ rowIndex ];
										const isTrailing = columnIndex === trailingColumnIndex;

										// A hidden cell keeps its grid slot (so the rest of the
										// column doesn't shift) but paints nothing and takes no
										// interaction — a calendar's ragged edges.
										if ( cell?.hidden ) {
											return (
												<div
													key={ `cell-${ columnIndex }-${ rowIndex }` }
													data-testid="heatmap-cell-hidden"
													aria-hidden="true"
													className={ clsx(
														styles[ 'heatmap-chart__cell' ],
														styles[ 'heatmap-chart__cell--hidden' ]
													) }
												/>
											);
										}

										// Filler: drawn like an empty cell so the grid fills its
										// container, but it stands for a day nothing was measured
										// for, so it reports nothing to a pointer or a screen
										// reader either.
										if ( cell?.placeholder ) {
											return (
												<div
													key={ `cell-${ columnIndex }-${ rowIndex }` }
													data-testid="heatmap-cell-placeholder"
													aria-hidden="true"
													className={ clsx(
														styles[ 'heatmap-chart__cell' ],
														styles[ 'heatmap-chart__cell--placeholder' ]
													) }
												/>
											);
										}

										const value = cell?.value ?? null;
										const hasValue = isPresent( value );
										// A roll-up is on a different scale from the cells beside
										// it, so it takes no fill. `present` is the fill, which the
										// trailing column opts out of; `hasValue` is whether there
										// is a number to draw, which it does not.
										const present = ! isTrailing && hasValue;
										const normalized = present ? getNormalizedValue( value, extent ) : 0;
										const flatIndex = columnIndex * rows + rowIndex;
										const info = buildTooltipData( columnIndex, rowIndex );
										const accessibleName =
											info.cellLabel ||
											`${ info.columnLabel ?? '' } ${ info.rowLabel ?? '' }`.trim();
										const accessibleLabel = `${ accessibleName }: ${
											info.value === null
												? __( 'No data', 'jetpack-charts' )
												: formatNumber( info.value )
										}`;

										return (
											<div
												key={ `cell-${ columnIndex }-${ rowIndex }` }
												id={ `${ chartId }-cell-${ columnIndex }-${ rowIndex }` }
												data-testid={ isTrailing ? 'heatmap-cell-trailing' : 'heatmap-cell' }
												role="gridcell"
												// Focus stays on the grid (aria-activedescendant); cells are
												// focusable but out of the tab order.
												tabIndex={ -1 }
												aria-colindex={ columnIndex + 1 }
												aria-label={ accessibleLabel }
												data-column={ columnIndex }
												data-row={ rowIndex }
												className={ clsx( styles[ 'heatmap-chart__cell' ], {
													[ styles[ 'heatmap-chart__cell--filled' ] ]: present,
													[ styles[ 'heatmap-chart__cell--strong' ] ]:
														present && cellHasLightText( normalized ),
													[ styles[ 'heatmap-chart__cell--trailing' ] ]: isTrailing,
													[ styles[ 'heatmap-chart__cell--selected' ] ]:
														selectedIndex === flatIndex,
												} ) }
												style={
													present
														? ( {
																'--a8c-charts-heatmap-cell-intensity': normalized,
														  } as CSSProperties )
														: undefined
												}
												onMouseMove={ handleCellMouseMove }
												onMouseLeave={ handleCellMouseLeave }
											>
												{ drawValues && hasValue && (
													<span className={ styles[ 'heatmap-chart__cell-value' ] }>
														{ /* Compact display; tooltip and aria-label keep full precision. */ }
														{ formatNumberCompact( value ) }
													</span>
												) }
											</div>
										);
									} ) }
								</div>
							);
						} ) }
					</div>
					{ withTooltips && tooltipOpen && tooltipData && (
						<TooltipInPortal top={ tooltipTop } left={ tooltipLeft }>
							<div className={ CHART_SCOPE_CLASS } role="tooltip" tabIndex={ -1 }>
								{ ( renderTooltip ?? defaultRenderTooltip )( tooltipData ) }
							</div>
						</TooltipInPortal>
					) }
				</ChartLayout>
			</ChartInstanceContext.Provider>
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

// The responsive wrapper already sizes the container; drop its measured pixel
// width/height so the grid fills that container via CSS and reflows fluidly,
// instead of pinning to a debounced measurement.
const HeatmapChartResponsiveInner: FC< HeatmapChartProps > = props => (
	<HeatmapChartWithProvider { ...props } width={ undefined } height={ undefined } />
);
HeatmapChartResponsiveInner.displayName = 'HeatmapChart';

const HeatmapChartResponsive = attachSubComponents(
	withResponsive< HeatmapChartProps >( HeatmapChartResponsiveInner ),
	{ Legend: HeatmapLegend }
) as FC< HeatmapChartProps & ResponsiveConfig > & HeatmapChartSubComponents;

export { HeatmapChartResponsive as default, HeatmapChart as HeatmapChartUnresponsive };
