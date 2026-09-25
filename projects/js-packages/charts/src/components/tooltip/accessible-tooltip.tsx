import { TooltipContext } from '@visx/xychart';
import clsx from 'clsx';
import { useContext, useEffect, useCallback, useMemo, useRef } from 'react';
import { ChartInstanceContext } from '../../charts/private/chart-instance-context';
import { useGlobalChartsContext } from '../../providers/chart-context/hooks/use-global-charts-context';
import { CATALOG_POINTERS } from '../../providers/chart-context/private/catalog-pointers';
import { useChartScopeElement, useStandaloneScopeClass } from '../../providers/chart-scope';
import { resolveCssVariable } from '../../utils';
import { XyChartTooltip } from './xy-chart-tooltip';
import type { SeriesData, DataPointDate } from '../../types';
import type { RenderTooltipParams, XyChartTooltipProps } from '../../visx/types';
import type { ReactNode } from 'react';

// Type for flattened tooltip data used in individual mode
export type FlattenedTooltipData = {
	datum: DataPointDate;
	seriesLabel: string;
	seriesIndex: number;
	dataPointIndex: number;
};

// Enhanced tooltip with keyboard navigation and accessibility
interface AccessibleTooltipProps extends Omit<
	XyChartTooltipProps< DataPointDate >,
	'renderTooltip'
> {
	renderTooltip?: ( params: RenderTooltipParams< DataPointDate > ) => ReactNode;
	selectedIndex?: number | undefined;
	tooltipRef?: ( element: HTMLDivElement | null ) => void;
	keyboardFocusedClassName?: string;
	/**
	 * Flattened tooltip data prepared by parent component
	 * Each index corresponds to one tooltip to show
	 */
	tooltipData?: FlattenedTooltipData[];
	/**
	 * For line charts: series data to show all series at selected data point
	 * When provided, shows all series instead of individual tooltips
	 */
	series?: SeriesData[];
	/**
	 * Whether to combine tooltip information from multiple series into a single tooltip. This is useful for line charts.
	 * Or to show individual tooltips for each series. This is useful for bar charts.
	 */
	mode?: 'individual' | 'group';
}

export const AccessibleTooltip: React.FC< AccessibleTooltipProps > = ( {
	renderTooltip,
	selectedIndex,
	tooltipRef,
	keyboardFocusedClassName,
	series = [],
	mode = 'group',
	verticalCrosshairStyle,
	horizontalCrosshairStyle,
	...props
} ) => {
	const tooltipContext = useContext( TooltipContext );
	const scopeElement = useChartScopeElement();

	// The stroke is read at the scope element, which a consumer can set outside the chart's own ancestors; see TOKENS.md#the-svg-bridge.
	const crosshairStroke = useMemo( () => {
		const stroke = resolveCssVariable( CATALOG_POINTERS.grid, scopeElement );

		// Passing `stroke: undefined` would erase the crosshair: it overrides visx's own value, and SVG's initial `stroke` is `none`.
		return stroke ? { stroke } : undefined;
	}, [ scopeElement ] );

	const standaloneScopeClass = useStandaloneScopeClass();

	const tooltipData = useMemo( () => {
		if ( mode !== 'individual' ) return [];
		if ( series.length === 0 ) return [];

		const maxDataPoints = Math.max( ...series.map( s => s.data.length ) );
		const flattened: Array< {
			datum: DataPointDate;
			seriesLabel: string;
			seriesIndex: number;
			dataPointIndex: number;
		} > = [];

		// Pattern: [series1[0], series2[0], series3[0], series1[1], series2[1], series3[1], ...]
		for ( let dataPointIndex = 0; dataPointIndex < maxDataPoints; dataPointIndex++ ) {
			for ( let seriesIndex = 0; seriesIndex < series.length; seriesIndex++ ) {
				const seriesData = series[ seriesIndex ];
				if ( dataPointIndex < seriesData.data.length ) {
					flattened.push( {
						datum: seriesData.data[ dataPointIndex ] as DataPointDate,
						seriesLabel: seriesData.label,
						seriesIndex,
						dataPointIndex,
					} );
				}
			}
		}

		return flattened;
	}, [ series, mode ] );

	// Tracks whether this effect opened a tooltip, so it only closes its own.
	const hasKeyboardSelection = useRef( false );

	// visx's own `hideTooltip` is debounced by 400ms, long enough for a stale datum to be
	// repainted against a changed series list. This is the undebounced close it wraps.
	const closeTooltipNow = useCallback( () => {
		tooltipContext?.updateTooltip( {
			tooltipOpen: false,
			tooltipLeft: undefined,
			tooltipTop: undefined,
			tooltipData: undefined,
		} );
		// Don't include tooltipContext in the dependency array to avoid loop.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const chartId = useContext( ChartInstanceContext )?.chartId;
	const { getHiddenSeries } = useGlobalChartsContext();
	const hiddenSeriesKey = chartId
		? JSON.stringify( [ ...getHiddenSeries( chartId ) ].sort() )
		: undefined;
	const lastHiddenSeriesKey = useRef( hiddenSeriesKey );

	// Hiding a series re-points every tooltip index at a different series, so a tooltip opened by
	// the pointer would keep showing a datum that is no longer on the chart. Nothing else closes
	// it: the pointer has not moved, so visx never fires the leave that would.
	useEffect( () => {
		const changed = lastHiddenSeriesKey.current !== hiddenSeriesKey;
		lastHiddenSeriesKey.current = hiddenSeriesKey;

		// A keyboard selection is reconciled by `useKeyboardNavigation` instead, which either
		// re-shows the tooltip at a valid index or clears the selection for the branch below.
		if ( changed && selectedIndex === undefined ) {
			closeTooltipNow();
		}
	}, [ hiddenSeriesKey, selectedIndex, closeTooltipNow ] );

	// Handle tooltip highlighting for keyboard navigation
	useEffect( () => {
		if ( selectedIndex === undefined ) {
			// visx debounces the hide and cancels only the most recently scheduled one,
			// so hiding on every run leaves earlier hides pending. One of those lands
			// mid-navigation and closes the tooltip the user is reading.
			if ( hasKeyboardSelection.current ) {
				hasKeyboardSelection.current = false;
				closeTooltipNow();
			}
			return;
		}

		hasKeyboardSelection.current = true;

		if ( mode === 'group' ) {
			// Show all series at the selected data point index in single tooltip.
			series.forEach( ( s, index ) => {
				if ( selectedIndex < s.data.length ) {
					const datum = s.data[ selectedIndex ];

					tooltipContext?.showTooltip( {
						datum,
						key: s.label,
						index,
					} );
				}
			} );
		} else if ( mode === 'individual' ) {
			// Show individual tooltips for each datapoint from each series.
			if ( selectedIndex < tooltipData.length ) {
				const tooltipItem = tooltipData[ selectedIndex ];

				tooltipContext?.showTooltip( {
					datum: tooltipItem.datum,
					key: tooltipItem.seriesLabel,
					index: tooltipItem.dataPointIndex,
				} );
			}
		}

		// Don't include tooltipContext in the dependency array to avoid loop.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ selectedIndex, tooltipData, series ] );

	// Create a focusable renderTooltip that includes accessibility features
	const focusableRenderTooltip = useMemo( () => {
		if ( ! renderTooltip ) return undefined;

		return ( params: RenderTooltipParams< DataPointDate > ) => {
			const tooltipContent = renderTooltip( params );

			if ( selectedIndex !== undefined ) {
				return (
					<div
						ref={ tooltipRef }
						tabIndex={ -1 }
						role="tooltip"
						aria-atomic="true"
						className={ clsx( standaloneScopeClass, keyboardFocusedClassName ) }
						data-testid={ `chart-tooltip-${ selectedIndex }` }
						key={ `chart-tooltip-${ selectedIndex }` }
					>
						{ tooltipContent }
					</div>
				);
			}

			return (
				<div className={ standaloneScopeClass } role="tooltip" aria-live="polite">
					{ tooltipContent }
				</div>
			);
		};
	}, [ renderTooltip, selectedIndex, tooltipRef, keyboardFocusedClassName, standaloneScopeClass ] );

	return (
		<XyChartTooltip
			{ ...props }
			verticalCrosshairStyle={ { ...crosshairStroke, ...verticalCrosshairStyle } }
			horizontalCrosshairStyle={ { ...crosshairStroke, ...horizontalCrosshairStyle } }
			renderTooltip={ focusableRenderTooltip }
		/>
	);
};

// Keyboard navigation hook for charts
interface UseKeyboardNavigationProps {
	selectedIndex: number | undefined;
	setSelectedIndex: ( index: number | undefined ) => void;
	isNavigating: boolean;
	setIsNavigating: ( navigating: boolean ) => void;
	chartRef: React.RefObject< HTMLDivElement >;
	/**
	 * Total number of navigation points (length of tooltip data array)
	 */
	totalPoints: number;
	/**
	 * Called with the selected index on Enter or Space, so a chart can treat the
	 * keyboard selection the way it treats a click.
	 */
	onActivate?: ( index: number ) => void;
	preventTooltipScroll?: boolean;
	/**
	 * Identity of the series the navigation indexes run over, for charts whose index space depends
	 * on which series are visible. Swapping one hidden series for another of the same length leaves
	 * `totalPoints` unchanged, so the count alone cannot detect it.
	 */
	visibleSeriesKey?: string;
}

export const useKeyboardNavigation = ( {
	selectedIndex,
	setSelectedIndex,
	isNavigating,
	setIsNavigating,
	chartRef,
	totalPoints,
	onActivate,
	preventTooltipScroll = false,
	visibleSeriesKey,
}: UseKeyboardNavigationProps ) => {
	// `chartRef` sits inside the focusable grid, so the grid is what focus returns to and is measured against.
	const getChartRoot = useCallback(
		(): HTMLElement | null =>
			chartRef.current?.closest< HTMLElement >( '[role="grid"]' ) ?? chartRef.current,
		[ chartRef ]
	);

	const focusWithoutScrollIfNeeded = useCallback(
		( element: HTMLElement | null | undefined ) => {
			if ( preventTooltipScroll ) {
				element?.focus( { preventScroll: true } );
			} else {
				element?.focus();
			}
		},
		[ preventTooltipScroll ]
	);

	// Focus the tooltip as soon as it is rendered
	const tooltipRef = useCallback(
		( element: HTMLDivElement | null ) => {
			if ( element && selectedIndex !== undefined ) {
				focusWithoutScrollIfNeeded( element );
			}
		},
		[ focusWithoutScrollIfNeeded, selectedIndex ]
	);

	const previousTotalPoints = useRef( totalPoints );
	const previousVisibleSeriesKey = useRef( visibleSeriesKey );

	// Hiding or showing a series moves every index onto a different bar. The count alone misses a
	// swap that keeps it the same, such as hiding one series while revealing another of equal length.
	// Clear rather than clamp once focus has left the chart: a new tooltip would pull focus back.
	useEffect( () => {
		const countChanged = previousTotalPoints.current !== totalPoints;
		const seriesChanged = previousVisibleSeriesKey.current !== visibleSeriesKey;
		previousTotalPoints.current = totalPoints;
		previousVisibleSeriesKey.current = visibleSeriesKey;

		if ( ( ! countChanged && ! seriesChanged ) || selectedIndex === undefined ) {
			return;
		}

		const { activeElement } = document;
		const focusIsInChart = activeElement !== null && !! getChartRoot()?.contains( activeElement );

		// A swap that leaves the count alone gives the same index a different series, so unlike a
		// count change there is no shorter range to clamp into.
		if ( totalPoints === 0 || ! focusIsInChart || ! countChanged ) {
			setSelectedIndex( undefined );
			setIsNavigating( false );
			// Clearing unmounts the focused tooltip, which would drop focus to the body.
			if ( focusIsInChart ) {
				focusWithoutScrollIfNeeded( getChartRoot() );
			}
			return;
		}

		setSelectedIndex( Math.min( selectedIndex, totalPoints - 1 ) );
	}, [
		selectedIndex,
		totalPoints,
		visibleSeriesKey,
		setSelectedIndex,
		setIsNavigating,
		getChartRoot,
		focusWithoutScrollIfNeeded,
	] );

	// Returning focus from the tooltip must not restore the selection Escape just cleared.
	const onChartFocus = useCallback(
		( event: React.FocusEvent< HTMLDivElement > ) => {
			if ( event.currentTarget.contains( event.relatedTarget ) ) {
				return;
			}
			if ( ! isNavigating && selectedIndex !== undefined ) {
				setSelectedIndex( 0 );
			}
		},
		[ isNavigating, selectedIndex, setSelectedIndex ]
	);

	// The point the pointer took over a keyboard selection at, where the next arrow key continues from.
	const pointerIndex = useRef< number | undefined >( undefined );

	// The pointer is the latest input, so it ends a keyboard selection instead of competing with it.
	const onChartPointerMove = useCallback(
		( index: number ) => {
			if ( selectedIndex === undefined ) {
				if ( pointerIndex.current !== undefined ) {
					pointerIndex.current = index;
				}
				return;
			}
			const root = getChartRoot();
			const activeElement = root?.ownerDocument.activeElement;
			// Focus elsewhere on the page stays there; a hover must not pull it back into the chart.
			if ( activeElement && root.contains( activeElement ) ) {
				pointerIndex.current = index;
				focusWithoutScrollIfNeeded( root );
			}
			setSelectedIndex( undefined );
			setIsNavigating( false );
		},
		[ selectedIndex, setSelectedIndex, setIsNavigating, getChartRoot, focusWithoutScrollIfNeeded ]
	);

	// On each blur of chart, keyboard navigation should restart from first tooltip
	const onChartBlur = useCallback(
		( event: React.FocusEvent< HTMLDivElement > ) => {
			setIsNavigating( false );
			if ( ! event.currentTarget.contains( event.relatedTarget ) ) {
				pointerIndex.current = undefined;
			}
		},
		[ setIsNavigating ]
	);

	const onChartKeyDown = useCallback(
		( event: React.KeyboardEvent< HTMLDivElement > ) => {
			if ( event.key === 'Tab' || event.key === 'Escape' ) {
				// Consuming Escape with nothing open would swallow the first Escape of a surrounding Modal.
				if ( event.key === 'Escape' && selectedIndex !== undefined ) {
					event.preventDefault();
				}
				focusWithoutScrollIfNeeded( getChartRoot() );
				setSelectedIndex( undefined );
				setIsNavigating( false );
				pointerIndex.current = undefined;
				return;
			}

			if ( totalPoints === 0 ) return;

			const currentSelectedIndex = selectedIndex ?? pointerIndex.current ?? -1;
			if ( event.key === 'ArrowRight' || event.key === 'ArrowLeft' ) {
				pointerIndex.current = undefined;
			}

			// WAI-ARIA grid: arrows stop at the first and last cell.
			if ( event.key === 'ArrowRight' ) {
				event.preventDefault();
				setIsNavigating( true );
				setSelectedIndex( Math.min( currentSelectedIndex + 1, totalPoints - 1 ) );
			} else if ( event.key === 'ArrowLeft' ) {
				event.preventDefault();
				setIsNavigating( true );
				setSelectedIndex( Math.max( currentSelectedIndex - 1, 0 ) );
			} else if ( ( event.key === 'Enter' || event.key === ' ' ) && selectedIndex !== undefined ) {
				event.preventDefault();
				onActivate?.( selectedIndex );
			}
		},
		[
			totalPoints,
			selectedIndex,
			setSelectedIndex,
			setIsNavigating,
			getChartRoot,
			focusWithoutScrollIfNeeded,
			onActivate,
		]
	);

	return {
		tooltipRef,
		onChartFocus,
		onChartBlur,
		onChartKeyDown,
		onChartPointerMove,
	};
};
