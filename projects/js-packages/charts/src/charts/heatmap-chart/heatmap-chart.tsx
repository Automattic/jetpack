import { formatNumber, formatNumberCompact } from '@automattic/number-formatters';
import { useTooltip, useTooltipInPortal } from '@visx/tooltip';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
	GlobalChartsProvider,
	useChartId,
	useGlobalChartsContext,
	GlobalChartsContext,
} from '../../providers';
import { attachSubComponents } from '../../utils';
import {
	isValidHexColor,
	mixHexColors,
	normalizeColorToHex,
	prefersLightText,
} from '../../utils/color-utils';
import { Center } from '../private/center';
import { useChartChildren } from '../private/chart-composition';
import { ChartLayout } from '../private/chart-layout';
import { SingleChartContext } from '../private/single-chart-context';
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
import type { HeatmapChartProps, HeatmapTooltipData } from './types';
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
	rowLabels = [],
	primaryColor,
	gap = 'md',
	withTooltips = false,
	renderTooltip,
	children,
} ) => {
	const chartId = useChartId( providedChartId );
	const { getElementStyles, resolveThemeColor, theme } = useGlobalChartsContext();
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

	// Resolve the background in the provider's theme scope so the blended-fill text
	// color tracks a themed (e.g. dark) background.
	const chartBackgroundHex = resolveThemeColor( theme.backgroundColor );

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

	const { compactCellGap, compactCellSize } = heatmapChartSettings;
	const drawValues = showValues ?? ! compact;

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

	const onChartBlur = useCallback( () => {
		setSelectedIndex( undefined );
		hideTooltip();
	}, [ hideTooltip ] );

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
		[ rows, columns, selectedIndex, hideTooltip ]
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

	const trackSize = compact ? 'var(--heatmap-cell-size)' : 'minmax(0, 1fr)';
	const gridStyle: Record< string, string | number > = {
		'--heatmap-primary': primaryColorHex,
		'--heatmap-bg': theme.backgroundColor,
		gridTemplateColumns: `auto repeat(${ columns }, ${ trackSize })`,
		gridTemplateRows: `auto repeat(${ rows }, ${ trackSize })`,
	};
	if ( compact ) {
		gridStyle[ '--heatmap-cell-gap' ] = `${ compactCellGap }px`;
		gridStyle[ '--heatmap-cell-size' ] = `${ compactCellSize }px`;
	}

	const activeDescendant =
		selectedIndex !== undefined
			? `${ chartId }-cell-${ Math.floor( selectedIndex / rows ) }-${ selectedIndex % rows }`
			: undefined;

	return (
		<HeatmapContext.Provider value={ heatmapContext }>
			<SingleChartContext.Provider value={ { chartId } }>
				<ChartLayout
					legendPosition="bottom"
					// Legend renders via trailingContent, not the legend slot.
					legendChildren={ [] }
					trailingContent={ nonLegendChildren }
					gap={ gap }
					className={ clsx( 'heatmap-chart', styles[ 'heatmap-chart' ], className ) }
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
						} ) }
						style={ gridStyle as CSSProperties }
					>
						{ /* Header row preserves the grid structure; cell aria-labels include this text. */ }
						<div role="row" aria-hidden="true" className={ styles[ 'heatmap-chart__row' ] }>
							<span />
							{ data.map( ( column, columnIndex ) => (
								<span
									key={ `col-${ columnIndex }` }
									className={ styles[ 'heatmap-chart__col-label' ] }
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
									<span aria-hidden="true" className={ styles[ 'heatmap-chart__row-label' ] }>
										{ labelVisible ? rowLabels[ rowIndex ] ?? '' : '' }
									</span>
									{ data.map( ( column, columnIndex ) => {
										const cell = column.data[ rowIndex ];
										const value = cell?.value ?? null;
										const present = isPresent( value );
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
												data-testid="heatmap-cell"
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
													[ styles[ 'heatmap-chart__cell--selected' ] ]:
														selectedIndex === flatIndex,
												} ) }
												style={
													present ? ( { '--intensity': normalized } as CSSProperties ) : undefined
												}
												onMouseMove={ handleCellMouseMove }
												onMouseLeave={ handleCellMouseLeave }
											>
												{ drawValues && present && (
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
							<div role="tooltip" tabIndex={ -1 }>
								{ ( renderTooltip ?? defaultRenderTooltip )( tooltipData ) }
							</div>
						</TooltipInPortal>
					) }
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
