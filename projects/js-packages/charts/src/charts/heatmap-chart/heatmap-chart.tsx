import { formatNumber, formatNumberCompact } from '@automattic/number-formatters';
import { useTooltip } from '@visx/tooltip';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BoundedTooltip } from '../../components/tooltip/private/bounded-tooltip';
import {
	GlobalChartsProvider,
	useChartId,
	useChartScopeElement,
	useGlobalChartsContext,
	GlobalChartsContext,
} from '../../providers';
import { CATALOG_POINTERS } from '../../providers/chart-context/private/catalog-pointers';
import { useStandaloneScopeClass } from '../../providers/chart-scope';
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
	resolveColumnGroups,
} from './private';
import {
	firstCalendarCell,
	firstGridCell,
	isNavigationKey,
	stepCalendarCell,
	stepGridCell,
} from './private/keyboard-navigation';
import type { HeatmapContextValue } from './private';
import type { CellBlock, CellPosition } from './private/keyboard-navigation';
import type { HeatmapChartProps, HeatmapTooltipData } from './types';
import type { ResponsiveConfig } from '../private/with-responsive';
import type { CSSProperties, FC } from 'react';

// Mirrors the color-mix floor in heatmap-chart.module.scss (.heatmap-chart__cell--filled):
// the rendered fill is the primary mixed over the chart background at 0.15 + 0.85 * intensity.
const CELL_MIX_FLOOR = 0.15;

// One instance, not a `[]` default in the signature: `buildTooltipData` keys on
// it, and a fresh array per render re-ran the keyboard tooltip effect endlessly.
const NO_ROW_LABELS: string[] = [];

// The cell's own label wins; otherwise the group, column and row labels name it.
const cellName = ( info: HeatmapTooltipData ) =>
	info.cellLabel ||
	[ info.groupLabel, info.columnLabel, info.rowLabel ].filter( Boolean ).join( ' ' );

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
	rowLabels = NO_ROW_LABELS,
	columnGroups,
	keyboardNavigation = 'grid',
	ariaLabel,
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

	const [ selected, setSelected ] = useState< CellPosition | undefined >();
	const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData, showTooltip, hideTooltip } =
		useTooltip< HeatmapTooltipData >();
	const standaloneScopeClass = useStandaloneScopeClass();
	const containerRef = useRef< HTMLDivElement >( null );
	// The chart root positions the tooltip, so pointer and cell coordinates are
	// measured against it — found by its id rather than by walking up, so
	// whatever ChartLayout wraps the grid in cannot shift the origin.
	const getTooltipOrigin = useCallback(
		() =>
			containerRef.current
				?.closest( `[data-chart-id="heatmap-chart-${ chartId }"]` )
				?.getBoundingClientRect() ?? null,
		[ chartId ]
	);

	const { color: primaryColorHex } = getElementStyles( {
		index: 0,
		overrideColor: primaryColor,
	} );

	// The cell blend substitutes this role at the cell; this read happens at the scope
	// element, so an override on the chart's own class makes the two disagree. CHARTS-255.
	const chartBackgroundHex = normalizeColorToHex(
		CATALOG_POINTERS.background,
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

	const columns = data.length;
	const rows = Math.max( 0, ...data.map( column => column.data.length ) );
	// Line 1 is the row-label track, so the data columns start on line 2.
	const groupLayout = useMemo(
		() => resolveColumnGroups( columnGroups, columns, 2 ),
		[ columnGroups, columns ]
	);

	const { compactCellGap, compactCellSize, groupGap } = heatmapChartSettings;
	const drawValues = showValues ?? ! compact;

	const buildTooltipData = useCallback(
		( columnIndex: number, rowIndex: number ): HeatmapTooltipData => {
			const cell = data[ columnIndex ]?.data[ rowIndex ];
			const group = groupLayout.columns[ columnIndex ]?.group;
			return {
				value: cell?.value ?? null,
				rowLabel: rowLabels[ rowIndex ],
				columnLabel: data[ columnIndex ]?.label,
				groupLabel: group === undefined ? undefined : groupLayout.groups[ group ]?.label,
				cellLabel: cell?.label,
				row: rowIndex,
				column: columnIndex,
			};
		},
		[ data, rowLabels, groupLayout ]
	);

	const onChartBlur = useCallback( () => {
		setSelected( undefined );
		hideTooltip();
	}, [ hideTooltip ] );

	// Both empty-slot kinds are skipped by navigation: `hidden` paints nothing,
	// `placeholder` paints an empty cell, and neither has a value to report.
	const isCellInert = useCallback(
		( col: number, row: number ) => {
			const cell = data[ col ]?.data[ row ];
			return cell?.hidden === true || cell?.placeholder === true;
		},
		[ data ]
	);

	// Calendar navigation reads each column group as a page; ungrouped columns
	// (or the whole grid without groups) make a page of their own.
	const blocks = useMemo< CellBlock[] >( () => {
		const grouped = groupLayout.groups.map( ( group, index ) => {
			const start = groupLayout.columns.findIndex( column => column.group === index );
			return { start, end: start + group.span };
		} );
		const groupedEnd = grouped.length ? grouped[ grouped.length - 1 ].end : 0;
		return groupedEnd < columns ? [ ...grouped, { start: groupedEnd, end: columns } ] : grouped;
	}, [ groupLayout, columns ] );

	const onChartKeyDown = useCallback(
		( event: React.KeyboardEvent< HTMLDivElement > ) => {
			if ( event.key === 'Tab' || event.key === 'Escape' ) {
				setSelected( undefined );
				hideTooltip();
				return;
			}
			if ( ! isNavigationKey( event.key, keyboardNavigation ) ) {
				return;
			}

			event.preventDefault();

			const grid = { columns, rows, isInert: isCellInert };
			if ( selected === undefined ) {
				setSelected(
					keyboardNavigation === 'calendar'
						? firstCalendarCell( grid, blocks )
						: firstGridCell( grid )
				);
				return;
			}

			const next =
				keyboardNavigation === 'calendar'
					? stepCalendarCell( grid, blocks, selected, event.key )
					: stepGridCell( grid, selected, event.key );
			if ( next ) {
				setSelected( next );
			}
		},
		[ rows, columns, selected, hideTooltip, isCellInert, keyboardNavigation, blocks ]
	);

	const handleCellMouseMove = useCallback(
		( event: React.MouseEvent< HTMLDivElement > ) => {
			if ( ! withTooltips ) {
				return;
			}
			const origin = getTooltipOrigin();
			if ( ! origin ) {
				return;
			}
			const target = event.currentTarget;
			const columnIndex = Number( target.dataset.column );
			const rowIndex = Number( target.dataset.row );
			showTooltip( {
				tooltipLeft: event.clientX - origin.left,
				tooltipTop: event.clientY - origin.top,
				tooltipData: buildTooltipData( columnIndex, rowIndex ),
			} );
		},
		[ withTooltips, showTooltip, buildTooltipData, getTooltipOrigin ]
	);

	const getCellElement = useCallback(
		( col: number, row: number ) =>
			typeof document !== 'undefined'
				? document.getElementById( `${ chartId }-cell-${ col }-${ row }` )
				: null,
		[ chartId ]
	);

	const handleCellMouseLeave = useCallback( () => {
		// Keyboard selection owns the tooltip; don't let a mouse-out clear it.
		if ( withTooltips && selected === undefined ) {
			hideTooltip();
		}
	}, [ withTooltips, selected, hideTooltip ] );

	// Focus stays on the grid (aria-activedescendant), so the browser never scrolls
	// the selected cell into a scroll container's view on its own. Keyed on the
	// selection alone: a data refresh must not scroll the user back to it.
	useEffect( () => {
		if ( selected === undefined ) {
			return;
		}
		const cell = getCellElement( selected.column, selected.row );
		cell?.scrollIntoView?.( { block: 'nearest', inline: 'nearest' } );
	}, [ selected, getCellElement ] );

	// Anchor the tooltip at the selected cell's center on keyboard nav. Cleared on blur/Escape,
	// not here, so a mouse hover (no selection) isn't affected.
	useEffect( () => {
		if ( ! withTooltips || selected === undefined ) {
			return;
		}
		const origin = getTooltipOrigin();
		if ( ! origin ) {
			return;
		}
		const rect = getCellElement( selected.column, selected.row )?.getBoundingClientRect();
		showTooltip( {
			tooltipLeft: rect ? rect.left + rect.width / 2 - origin.left : 0,
			tooltipTop: rect ? rect.top + rect.height / 2 - origin.top : 0,
			tooltipData: buildTooltipData( selected.column, selected.row ),
		} );
	}, [ selected, withTooltips, getCellElement, buildTooltipData, showTooltip, getTooltipOrigin ] );

	const defaultRenderTooltip = useCallback(
		( info: HeatmapTooltipData ) => (
			<div>
				<strong>{ cellName( info ) }</strong>
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
	const hasColumnLabels = data.some( column => Boolean( column.label ) );
	const hasGroups = groupLayout.groups.length > 0;
	// Every item is placed by hand rather than auto-flowed, so the template can
	// carry gap tracks that hold no cell.
	const columnLine = ( columnIndex: number ) => groupLayout.columns[ columnIndex ].line;
	const firstDataRow = hasColumnLabels ? 2 : 1;
	// A summary column takes a content-sized track: a roll-up is wider than a
	// cell, and a shared track would stretch every cell to fit it. `max-content`
	// as the max keeps the leftover width out of it once the data tracks hit
	// `maxCellWidth`, where a plain `auto` would absorb it.
	const dataTrack = ( column: ( typeof data )[ number ] ) =>
		column.summary ? 'minmax(auto, max-content)' : columnTrack;
	// The group gap is a track of its own: a margin cannot widen a fixed or
	// minmax track the way it widens the summary's auto track. Compact cells
	// are fixed, so there the gaps share the leftover width instead.
	const gapTrack = compact ? `minmax(${ groupGap }px, 1fr)` : `${ groupGap }px`;
	const columnTracks = data
		.map( ( column, columnIndex ) =>
			groupLayout.columns[ columnIndex ].gapBefore
				? `${ gapTrack } ${ dataTrack( column ) }`
				: dataTrack( column )
		)
		.join( ' ' );
	const gridStyle: Record< string, string | number > = {
		'--a8c-charts-color-heatmap-primary': primaryColorHex,
		gridTemplateColumns: `auto ${ columnTracks }`,
		gridTemplateRows: `${ hasColumnLabels ? 'auto ' : '' }repeat(${ rows }, ${ rowTrack })${
			hasGroups ? ' auto' : ''
		}`,
	};
	if ( compact ) {
		gridStyle[ '--a8c-charts-dimension-heatmap-cell-gap' ] = `${ compactCellGap }px`;
		gridStyle[ '--a8c-charts-dimension-heatmap-cell-size' ] = `${ compactCellSize }px`;
	}

	// A summary column sits one gap apart from the data on either side; two
	// summaries side by side share no extra gap.
	const summaryGaps = ( columnIndex: number ) => {
		if ( ! data[ columnIndex ]?.summary ) {
			return {};
		}

		return {
			[ styles[ 'heatmap-chart__gap-start' ] ]:
				columnIndex > 0 && ! data[ columnIndex - 1 ]?.summary,
			[ styles[ 'heatmap-chart__gap-end' ] ]:
				columnIndex < columns - 1 && ! data[ columnIndex + 1 ]?.summary,
		};
	};

	const activeDescendant = selected
		? `${ chartId }-cell-${ selected.column }-${ selected.row }`
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
						aria-label={ ariaLabel ?? __( 'Heatmap chart', 'jetpack-charts' ) }
						aria-rowcount={ rows }
						aria-colcount={ columns }
						aria-activedescendant={ activeDescendant }
						tabIndex={ 0 }
						onBlur={ onChartBlur }
						onKeyDown={ onChartKeyDown }
						className={ clsx( styles[ 'heatmap-chart__grid' ], {
							[ styles[ 'heatmap-chart__grid--compact' ] ]: compact,
							[ styles[ 'heatmap-chart__grid--flex-gaps' ] ]: compact && hasGroups,
							[ styles[ 'heatmap-chart__grid--height-capped' ] ]: heightCapped,
						} ) }
						style={ gridStyle as CSSProperties }
					>
						{ /* Decorative: cell aria-labels already carry the column name. */ }
						{ hasColumnLabels && (
							<div role="row" aria-hidden="true" className={ styles[ 'heatmap-chart__row' ] }>
								<span style={ { gridColumn: 1, gridRow: 1 } } />
								{ data.map( ( column, columnIndex ) => (
									<span
										key={ `col-${ columnIndex }` }
										style={ { gridColumn: columnLine( columnIndex ), gridRow: 1 } }
										className={ clsx( styles[ 'heatmap-chart__col-label' ], {
											[ styles[ 'heatmap-chart__col-label--summary' ] ]: column.summary,
											...summaryGaps( columnIndex ),
										} ) }
									>
										{ column.label }
									</span>
								) ) }
							</div>
						) }

						{ Array.from( { length: rows } ).map( ( _row, rowIndex ) => {
							const labelVisible = ! compact || rowIndex % 2 === 0;
							const gridRow = firstDataRow + rowIndex;
							return (
								<div
									key={ `row-${ rowIndex }` }
									role="row"
									aria-rowindex={ rowIndex + 1 }
									className={ styles[ 'heatmap-chart__row' ] }
								>
									<span
										aria-hidden="true"
										className={ styles[ 'heatmap-chart__row-label' ] }
										style={ { gridColumn: 1, gridRow } }
									>
										{ labelVisible ? rowLabels[ rowIndex ] ?? '' : '' }
									</span>
									{ data.map( ( column, columnIndex ) => {
										const cell = column.data[ rowIndex ];
										const placement = { gridColumn: columnLine( columnIndex ), gridRow };

										// A hidden cell keeps its grid slot (so the rest of the
										// column doesn't shift) but paints nothing and takes no
										// interaction — a calendar's ragged edges.
										if ( cell?.hidden ) {
											return (
												<div
													key={ `cell-${ columnIndex }-${ rowIndex }` }
													data-testid="heatmap-cell-hidden"
													aria-hidden="true"
													style={ placement }
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
													style={ placement }
													className={ clsx(
														styles[ 'heatmap-chart__cell' ],
														styles[ 'heatmap-chart__cell--placeholder' ]
													) }
												/>
											);
										}

										const value = cell?.value ?? null;
										const present = isPresent( value );
										// A summary cell is on another scale, so it takes no fill.
										const filled = present && ! column.summary;
										const normalized = filled ? getNormalizedValue( value, extent ) : 0;
										const info = buildTooltipData( columnIndex, rowIndex );
										const accessibleLabel = `${ cellName( info ) }: ${
											info.value === null
												? __( 'No data', 'jetpack-charts' )
												: formatNumber( info.value )
										}`;

										return (
											<div
												key={ `cell-${ columnIndex }-${ rowIndex }` }
												id={ `${ chartId }-cell-${ columnIndex }-${ rowIndex }` }
												data-testid={ column.summary ? 'heatmap-cell-summary' : 'heatmap-cell' }
												role="gridcell"
												// Focus stays on the grid (aria-activedescendant); cells are
												// focusable but out of the tab order.
												tabIndex={ -1 }
												aria-colindex={ columnIndex + 1 }
												aria-label={ accessibleLabel }
												data-column={ columnIndex }
												data-row={ rowIndex }
												className={ clsx( styles[ 'heatmap-chart__cell' ], {
													[ styles[ 'heatmap-chart__cell--filled' ] ]: filled,
													[ styles[ 'heatmap-chart__cell--strong' ] ]:
														filled && cellHasLightText( normalized ),
													[ styles[ 'heatmap-chart__cell--summary' ] ]: column.summary,
													...summaryGaps( columnIndex ),
													[ styles[ 'heatmap-chart__cell--selected' ] ]:
														selected?.column === columnIndex && selected?.row === rowIndex,
												} ) }
												style={
													{
														...placement,
														...( filled
															? { '--a8c-charts-heatmap-cell-intensity': normalized }
															: {} ),
													} as CSSProperties
												}
												onMouseMove={ handleCellMouseMove }
												onMouseLeave={ handleCellMouseLeave }
											>
												{ ( drawValues || column.summary ) && present && (
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
						{ hasGroups && (
							<div role="row" aria-hidden="true" className={ styles[ 'heatmap-chart__row' ] }>
								{ groupLayout.groups.map( ( group, groupIndex ) => (
									<span
										key={ `group-${ groupIndex }` }
										data-testid="heatmap-group-label"
										className={ styles[ 'heatmap-chart__group-label' ] }
										style={ {
											gridColumn: `${ group.line } / span ${ group.span }`,
											gridRow: firstDataRow + rows,
										} }
									>
										{ group.label }
									</span>
								) ) }
							</div>
						) }
					</div>
					{ withTooltips && tooltipOpen && tooltipData && (
						<BoundedTooltip top={ tooltipTop } left={ tooltipLeft }>
							<div className={ standaloneScopeClass } role="tooltip" tabIndex={ -1 }>
								{ ( renderTooltip ?? defaultRenderTooltip )( tooltipData ) }
							</div>
						</BoundedTooltip>
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
