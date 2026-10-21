import { formatNumber, formatNumberCompact } from '@automattic/number-formatters';
import { useTooltip } from '@visx/tooltip';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import isEqual from 'fast-deep-equal';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { BoundedTooltip, TOOLTIP_Z_INDEX } from '../../components/tooltip/private/bounded-tooltip';
import { useIsomorphicLayoutEffect } from '../../hooks';
import {
	GlobalChartsProvider,
	useChartId,
	useChartScopeElement,
	useGlobalChartsContext,
	GlobalChartsContext,
} from '../../providers';
import {
	BACKGROUND_FALLBACK,
	CATALOG_POINTERS,
} from '../../providers/chart-context/private/catalog-pointers';
import { blendRgb, hexToRgb } from '../../providers/chart-context/private/perceptual-color';
import { resolveOpaqueHex } from '../../providers/chart-context/private/resolve-opaque-hex';
import { useStandaloneScopeClass } from '../../providers/chart-scope';
import { attachSubComponents } from '../../utils';
import { isValidHexColor, normalizeColorToHex } from '../../utils/color-utils';
import { createCssVariableResolver } from '../../utils/resolve-css-var';
import { warnOnce } from '../../utils/warn-once';
import { Center } from '../private/center';
import { useChartChildren } from '../private/chart-composition';
import { ChartInstanceContext } from '../private/chart-instance-context';
import { ChartLayout } from '../private/chart-layout';
import { pickLabelTextColorForFill, resolveLabelRoles } from '../private/label-text-color';
import { withResponsive } from '../private/with-responsive';
import styles from './heatmap-chart.module.scss';
import {
	fitCompactCells,
	getHeatmapScale,
	getValueExtent,
	getNormalizedValue,
	HeatmapContext,
	HeatmapLegend,
	isEmptyValue,
	isPresent,
	resolveColumnGroups,
	wrapColumnGroups,
} from './private';
import {
	firstCalendarCell,
	firstGridCell,
	isNavigationKey,
	stepCalendarCell,
	stepGridCell,
} from './private/keyboard-navigation';
import type { CompactCellFit, HeatmapContextValue } from './private';
import type { CellBlock, CellPosition } from './private/keyboard-navigation';
import type { HeatmapChartProps, HeatmapTooltipData } from './types';
import type { LabelRoles, LabelTextColor } from '../private/label-text-color';
import type { ResponsiveConfig } from '../private/with-responsive';
import type { CSSProperties, FC } from 'react';

// `label` is the stylesheet's default, so it needs no modifier.
const CELL_VALUE_MODIFIER: Record< LabelTextColor, string | undefined > = {
	label: undefined,
	'label-inverse': styles[ 'heatmap-chart__cell-value--inverse' ],
	black: styles[ 'heatmap-chart__cell-value--black' ],
	white: styles[ 'heatmap-chart__cell-value--white' ],
};

// One instance, not a `[]` default in the signature: `buildTooltipData` keys on
// it, and a fresh array per render re-ran the keyboard tooltip effect endlessly.
const NO_ROW_LABELS: string[] = [];

const TOOLTIP_BOX_STYLE: CSSProperties = { zIndex: TOOLTIP_Z_INDEX };

const largest = ( root: Element, selector: string, size: 'offsetWidth' | 'offsetHeight' ) =>
	Math.max(
		0,
		...Array.from( root.querySelectorAll< HTMLElement >( selector ), el => el[ size ] )
	);

// The box the grid may fill: the chart's own box less its other in-flow children
// (the legend, say) and the gaps between them.
const gridBox = ( chart: HTMLElement, grid: HTMLElement ) => {
	let height = chart.clientHeight;
	const rowGap = parseFloat( getComputedStyle( chart ).rowGap ) || 0;
	Array.from( chart.children ).forEach( child => {
		const { display, position } = getComputedStyle( child );
		if ( child === grid || display === 'none' || position === 'absolute' || position === 'fixed' ) {
			return;
		}
		height -= ( child as HTMLElement ).offsetHeight + rowGap;
	} );
	return { width: chart.clientWidth, height };
};

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
	fitCells = false,
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
	tooltipStyle,
	children,
} ) => {
	const chartId = useChartId( providedChartId );
	const tooltipBoxStyle = tooltipStyle
		? { ...TOOLTIP_BOX_STYLE, ...tooltipStyle }
		: TOOLTIP_BOX_STYLE;
	const { getElementStyles, theme } = useGlobalChartsContext();
	const scopeElement = useChartScopeElement();
	const { heatmapChart: heatmapChartSettings } = theme;
	const { nonLegendChildren } = useChartChildren( children, 'HeatmapChart' );

	const [ selected, setSelected ] = useState< CellPosition | undefined >();
	const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData, showTooltip, hideTooltip } =
		useTooltip< HeatmapTooltipData >();
	const standaloneScopeClass = useStandaloneScopeClass();
	const containerRef = useRef< HTMLDivElement >( null );
	const chartRef = useRef< HTMLDivElement >( null );
	const [ labelRoles, setLabelRoles ] = useState< LabelRoles | null >( null );
	const getTooltipOrigin = useCallback(
		() => chartRef.current?.getBoundingClientRect() ?? null,
		[]
	);

	const { color: primaryColorHex } = getElementStyles( {
		index: 0,
		overrideColor: primaryColor,
	} );

	// Both read at the scope element, so an override on the chart's own class reaches neither the
	// fill scale nor the text color (CHARTS-255). See-through counts as white, as for the palette.
	const resolveAtScope = createCssVariableResolver( scopeElement );
	const chartBackgroundHex =
		resolveOpaqueHex( CATALOG_POINTERS.background, resolveAtScope ) ?? BACKGROUND_FALLBACK;
	const emptyCellHex = resolveOpaqueHex( CATALOG_POINTERS.track, resolveAtScope );

	// If the primary cannot resolve to hex, the stylesheet falls back to its own blend.
	const primaryHex = normalizeColorToHex( primaryColorHex );
	const scale = useMemo(
		() =>
			isValidHexColor( primaryHex )
				? getHeatmapScale( primaryHex, chartBackgroundHex, emptyCellHex )
				: null,
		[ primaryHex, chartBackgroundHex, emptyCellHex ]
	);
	const fillVars = useMemo(
		() => ( {
			'--a8c-charts-color-heatmap-primary': primaryColorHex,
			...( scale && {
				'--a8c-charts-color-heatmap-low': scale.low,
				'--a8c-charts-color-heatmap-high': scale.high,
			} ),
		} ),
		[ primaryColorHex, scale ]
	);
	// Choose text color from the fill the cell paints, mirroring .heatmap-chart__cell--filled.
	const cellTextColor = ( intensity: number ): LabelTextColor =>
		scale
			? pickLabelTextColorForFill(
					blendRgb( hexToRgb( scale.high ), hexToRgb( scale.low ), intensity ),
					labelRoles,
					'label'
				)
			: 'label';

	// Read inside the chart's own class, where the cell text inherits them. Keyed on `data` too,
	// because the grid is not mounted while there is nothing to draw.
	useIsomorphicLayoutEffect( () => {
		if ( ! containerRef.current ) {
			return;
		}
		const next = resolveLabelRoles( createCssVariableResolver( containerRef.current ) );
		setLabelRoles( previous => ( isEqual( previous, next ) ? previous : next ) );
	}, [ data, className, primaryColorHex, chartBackgroundHex ] );

	const extent = useMemo( () => getValueExtent( data ), [ data ] );
	const heatmapContext = useMemo< HeatmapContextValue >(
		() => ( { extent, fillVars } ),
		[ extent, fillVars ]
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
	const hasColumnLabels = data.some( column => Boolean( column.label ) );
	const hasGroups = groupLayout.groups.length > 0;

	const [ fit, setFit ] = useState< CompactCellFit | null >( null );
	// A summary track is as wide as its figure, which the fit cannot size as a cell.
	const hasSummary = data.some( column => column.summary );
	const fitting = compact && fitCells && ! hasSummary;
	if ( fitCells && ! fitting ) {
		warnOnce(
			'heatmap:fitCells',
			'fitCells applies only in compact mode without summary columns, so the cells keep their size.'
		);
	}
	useIsomorphicLayoutEffect( () => {
		const chart = chartRef.current;
		const grid = containerRef.current;
		if ( ! fitting || ! chart || ! grid ) {
			setFit( null );
			return;
		}
		const measure = () => {
			const next = fitCompactCells( {
				...gridBox( chart, grid ),
				layout: groupLayout,
				rows,
				cellGap: compactCellGap,
				groupGap,
				rowLabelWidth: largest( grid, `.${ styles[ 'heatmap-chart__row-label' ] }`, 'offsetWidth' ),
				columnLabelHeight: hasColumnLabels
					? largest( grid, `.${ styles[ 'heatmap-chart__col-label' ] }`, 'offsetHeight' )
					: null,
				groupLabelHeight: hasGroups
					? largest( grid, `.${ styles[ 'heatmap-chart__group-label' ] }`, 'offsetHeight' )
					: null,
				minCellSize: compactCellSize,
			} );
			setFit( previous => ( isEqual( previous, next ) ? previous : next ) );
		};
		measure();
		if ( typeof ResizeObserver === 'undefined' ) {
			return;
		}
		// Commit before later observers in this delivery read the grid, or they see the
		// old cells at the new width, and before paint, so that frame is never drawn.
		const observer = new ResizeObserver( () => flushSync( measure ) );
		observer.observe( chart );
		return () => observer.disconnect();
	}, [
		fitting,
		groupLayout,
		rows,
		hasColumnLabels,
		hasGroups,
		compactCellGap,
		compactCellSize,
		groupGap,
	] );
	const wrapped = useMemo(
		() => ( fit ? wrapColumnGroups( groupLayout, fit.bands ) : null ),
		[ fit, groupLayout ]
	);

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

	// A data refresh that shrinks the grid would leave the selection on a slot that
	// no longer exists; navigating from there has nothing to step from.
	useEffect( () => {
		if ( selected && ( selected.column >= columns || selected.row >= rows ) ) {
			setSelected( undefined );
		}
	}, [ selected, columns, rows ] );

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
	// Every item is placed by hand rather than auto-flowed, so the template can
	// carry gap tracks that hold no cell.
	const placed = wrapped ?? groupLayout;
	const columnLine = ( columnIndex: number ) => placed.columns[ columnIndex ].line;
	const bandOf = ( columnIndex: number ) => placed.columns[ columnIndex ].band;
	const { bands } = placed;
	// Each band repeats the label row, the data rows and the group-label row, and
	// the next starts one group gap below.
	const bandRowCount = ( hasColumnLabels ? 1 : 0 ) + rows + ( hasGroups ? 1 : 0 ) + 1;
	const labelRowOf = ( band: number ) => 1 + band * bandRowCount;
	const dataRowOf = ( band: number, rowIndex: number ) =>
		labelRowOf( band ) + ( hasColumnLabels ? 1 : 0 ) + rowIndex;
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
	// Wrapped bands share one set of slots, each as wide as its widest group.
	const columnTracks = wrapped
		? wrapped.slotSpans
				.map( ( span, slot ) =>
					[ ...( slot > 0 ? [ gapTrack ] : [] ), ...Array( span ).fill( columnTrack ) ].join( ' ' )
				)
				.join( ' ' )
		: data
				.map( ( column, columnIndex ) =>
					groupLayout.columns[ columnIndex ].gapBefore
						? `${ gapTrack } ${ dataTrack( column ) }`
						: dataTrack( column )
				)
				.join( ' ' );
	const bandTracks = `${ hasColumnLabels ? 'auto ' : '' }repeat(${ rows }, ${ rowTrack })${
		hasGroups ? ' auto' : ''
	}`;
	const gridStyle: Record< string, string | number > = {
		...fillVars,
		gridTemplateColumns: `auto ${ columnTracks }`,
		gridTemplateRows: Array( bands ).fill( bandTracks ).join( ` ${ groupGap }px ` ),
	};
	if ( compact ) {
		gridStyle[ '--a8c-charts-dimension-heatmap-cell-gap' ] = `${ compactCellGap }px`;
		gridStyle[ '--a8c-charts-dimension-heatmap-cell-size' ] = `${
			fit?.cellSize ?? compactCellSize
		}px`;
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
					rootRef={ chartRef }
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
								<span style={ { gridColumn: 1, gridRow: labelRowOf( 0 ) } } />
								{ data.map( ( column, columnIndex ) => (
									<span
										key={ `col-${ columnIndex }` }
										style={ {
											gridColumn: columnLine( columnIndex ),
											gridRow: labelRowOf( bandOf( columnIndex ) ),
										} }
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
							return (
								<div
									key={ `row-${ rowIndex }` }
									role="row"
									aria-rowindex={ rowIndex + 1 }
									className={ styles[ 'heatmap-chart__row' ] }
								>
									{ Array.from( { length: bands } ).map( ( _band, band ) => (
										<span
											key={ `row-label-${ band }` }
											aria-hidden="true"
											className={ styles[ 'heatmap-chart__row-label' ] }
											style={ { gridColumn: 1, gridRow: dataRowOf( band, rowIndex ) } }
										>
											{ labelVisible ? ( rowLabels[ rowIndex ] ?? '' ) : '' }
										</span>
									) ) }
									{ data.map( ( column, columnIndex ) => {
										const cell = column.data[ rowIndex ];
										const placement = {
											gridColumn: columnLine( columnIndex ),
											gridRow: dataRowOf( bandOf( columnIndex ), rowIndex ),
										};

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
										const filled = present && ! column.summary && ! isEmptyValue( value, extent );
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
													<span
														className={ clsx(
															styles[ 'heatmap-chart__cell-value' ],
															filled && CELL_VALUE_MODIFIER[ cellTextColor( normalized ) ]
														) }
													>
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
								{ placed.groups.map( ( group, groupIndex ) => (
									<span
										key={ `group-${ groupIndex }` }
										data-testid="heatmap-group-label"
										className={ styles[ 'heatmap-chart__group-label' ] }
										style={ {
											gridColumn: `${ group.line } / span ${ group.span }`,
											gridRow: dataRowOf( group.band, rows ),
										} }
									>
										{ group.label }
									</span>
								) ) }
							</div>
						) }
					</div>
					{ withTooltips && tooltipOpen && tooltipData && (
						<BoundedTooltip top={ tooltipTop } left={ tooltipLeft } style={ tooltipBoxStyle }>
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
