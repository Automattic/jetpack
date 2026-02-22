import { hsl as d3Hsl } from '@visx/vendor/d3-color';
import {
	createContext,
	useCallback,
	useMemo,
	useState,
	useEffect,
	useLayoutEffect,
	useRef,
} from 'react';
import { useTooltipPortalRelocator } from '../../hooks/use-tooltip-portal-relocator';
import {
	getItemShapeStyles,
	getSeriesLineStyles,
	isValidHexColor,
	mergeThemes,
	resolveCssVariable,
	normalizeColorToHex,
} from '../../utils';
import { getChartColor, type ColorCache } from './private/get-chart-color';
import { defaultTheme } from './themes';
import type { GlobalChartsContextValue, ChartRegistration } from './types';
import type { ChartTheme, CompleteChartTheme } from '../../types';
import type { FC, ReactNode } from 'react';

export const GlobalChartsContext = createContext< GlobalChartsContextValue | null >( null );

export interface GlobalChartsProviderProps {
	children: ReactNode;
	theme?: Partial< ChartTheme >;
	/**
	 * Optional ref to an element that chart tooltip portals should be relocated into.
	 * When provided, visx tooltip portals (normally appended to document.body) will be
	 * moved into this container so they participate in the same effective CSS stacking context.
	 * The element referenced here, or one of its ancestors, should establish the desired
	 * stacking context (for example by using `position` and `z-index`) so that tooltips
	 * appear above the relevant chart content.
	 */
	portalContainer?: React.RefObject< HTMLElement | null >;
}

/**
 * Process an array of colors into a ColorCache structure.
 * Handles hex colors directly, and optionally resolves CSS variables if an element is provided.
 *
 * @param colors  - Array of color strings (hex or CSS variables)
 * @param element - DOM element for resolving CSS variables (null for sync init)
 * @return ColorCache with resolved colors and computed hue data
 */
function processColors( colors: string[] | undefined, element: HTMLElement | null ): ColorCache {
	const resolvedColors: string[] = [];
	const hues: number[] = [];
	const existingHslColors: Array< [ number, number, number ] > = [];
	let minHue = 360;
	let maxHue = 0;

	if ( Array.isArray( colors ) ) {
		for ( const color of colors ) {
			if ( color && typeof color === 'string' ) {
				let colorValue = color;

				// Handle CSS custom properties - resolve them to actual values
				// Supports both '--var-name' and 'var(--var-name)' formats
				if ( color.startsWith( '--' ) || color.startsWith( 'var(' ) ) {
					// CSS variables can only be resolved when DOM element is available
					if ( ! element ) {
						continue;
					}
					const resolved = resolveCssVariable( color, element );
					if ( resolved === null || resolved === '' ) {
						continue;
					}
					colorValue = resolved;
				}

				// Process hex colors
				if ( colorValue.startsWith( '#' ) ) {
					resolvedColors.push( colorValue );
					const hslColor = d3Hsl( colorValue );
					// d3Hsl returns NaN values for invalid colors
					if ( ! isNaN( hslColor.h ) ) {
						const hslTuple: [ number, number, number ] = [
							hslColor.h,
							hslColor.s * 100,
							hslColor.l * 100,
						];
						hues.push( hslTuple[ 0 ] );
						existingHslColors.push( hslTuple );
						minHue = Math.min( minHue, hslTuple[ 0 ] );
						maxHue = Math.max( maxHue, hslTuple[ 0 ] );
					}
				}
			}
		}
	}

	return { colors: resolvedColors, hues, existingHslColors, minHue, maxHue };
}

export const GlobalChartsProvider: FC< GlobalChartsProviderProps > = ( {
	children,
	theme,
	portalContainer,
} ) => {
	const [ charts, setCharts ] = useState< Map< string, ChartRegistration > >( () => new Map() );
	// Track hidden series per chart: chartId -> Set<seriesLabel>
	const [ hiddenSeries, setHiddenSeries ] = useState< Map< string, Set< string > > >(
		() => new Map()
	);

	// Ref to the wrapper element for resolving scoped CSS variables
	const wrapperRef = useRef< HTMLDivElement >( null );

	// Relocate tooltip portals into the wrapper (or a consumer-provided container) for z-index control.
	useTooltipPortalRelocator( portalContainer ?? wrapperRef );

	const providerTheme: CompleteChartTheme = useMemo( () => {
		return theme ? mergeThemes( defaultTheme, theme ) : defaultTheme;
	}, [ theme ] );

	// Cache expensive color computations that only change when theme colors change.
	// Initialize synchronously with hex colors (no DOM needed), then useLayoutEffect
	// re-processes to resolve CSS variables once DOM is available.
	const [ colorCache, setColorCache ] = useState< ColorCache >( () => {
		const mergedTheme = theme ? mergeThemes( defaultTheme, theme ) : defaultTheme;
		// Process hex colors synchronously (CSS variables skipped since no DOM yet)
		return processColors( mergedTheme.colors, null );
	} );

	// Re-compute color cache after DOM is updated to resolve CSS variables.
	// This is needed because CSS variables in <style> tags must be applied to the DOM first.
	useLayoutEffect( () => {
		setColorCache( processColors( providerTheme.colors, wrapperRef.current ) );
	}, [ providerTheme ] );

	const [ groupToColorMap, setGroupToColorMap ] = useState< Map< string, string > >(
		() => new Map()
	);

	// Reset group color mappings when theme colors change or when colorCache is updated.
	// The colorCache dependency ensures that after CSS variables are resolved by useLayoutEffect,
	// any 'transparent' placeholder colors cached in groupToColorMap are cleared.
	useEffect( () => {
		// Create a completely new Map instance to trigger dependencies, e.g. useChartLegendItems
		setGroupToColorMap( new Map() );
	}, [ providerTheme.colors, colorCache ] );

	const registerChart = useCallback( ( id: string, data: ChartRegistration ) => {
		setCharts( prev => new Map( prev ).set( id, data ) );
	}, [] );

	const unregisterChart = useCallback( ( id: string ) => {
		setCharts( prev => {
			const newMap = new Map( prev );
			newMap.delete( id );
			return newMap;
		} );
	}, [] );

	const getChartData = useCallback(
		( id: string ) => {
			return charts.get( id );
		},
		[ charts ]
	);

	const resolveColor = useCallback(
		( {
			group,
			index,
			overrideColor,
		}: {
			group?: string;
			index: number;
			overrideColor?: string;
		} ): string => {
			// Highest precedence: eg. explicit series stroke or chart color prop
			if ( overrideColor ) {
				return normalizeColorToHex( overrideColor, wrapperRef.current, resolveCssVariable );
			}

			// Fallback for first render when colorCache may not have all colors resolved yet.
			// Returns the color if available, or 'transparent' for CSS variables that need DOM.
			// This prevents color flicker by showing transparent instead of a generated wrong color.
			const getFirstRenderColor = ( colorIndex: number ): string | null => {
				const themeColorsCount = providerTheme.colors?.length ?? 0;
				const cacheFullyResolved = colorCache.colors.length >= themeColorsCount;

				// If cache has all theme colors resolved, use normal resolution path
				if ( cacheFullyResolved && colorIndex < colorCache.colors.length ) {
					return null;
				}

				// Cache not fully resolved (CSS vars pending) - check theme color at this index
				const themeColor = providerTheme.colors?.[ colorIndex ];
				if ( themeColor && isValidHexColor( themeColor ) ) {
					return themeColor;
				}
				// CSS variable or unresolved color - use transparent to avoid flicker
				if ( themeColor ) {
					return 'transparent';
				}
				return null;
			};

			// If group provided, maintain a stable assignment
			if ( group ) {
				const existing = groupToColorMap.get( group );

				if ( existing ) {
					return existing;
				}

				// Use map size as index to assign colors sequentially (0, 1, 2...)
				// ensuring each new group gets the next available palette color
				const assignedCount = groupToColorMap.size;
				const color =
					getFirstRenderColor( assignedCount ) ?? getChartColor( assignedCount, colorCache );
				groupToColorMap.set( group, color );

				return color;
			}

			return getFirstRenderColor( index ) ?? getChartColor( index, colorCache );
		},
		[ colorCache, groupToColorMap, providerTheme.colors ]
	);

	const getElementStyles = useCallback< GlobalChartsContextValue[ 'getElementStyles' ] >(
		( { data, index, overrideColor, legendShape } ) => {
			const isSeriesData = data && typeof data === 'object' && 'data' in data && 'options' in data;
			const isPointPercentageData = data && typeof data === 'object' && 'percentage' in data;

			return {
				color: resolveColor( {
					group: data?.group,
					index,
					overrideColor:
						overrideColor ||
						( isSeriesData && data?.options?.stroke ) ||
						( isPointPercentageData && data?.color ),
				} ),
				lineStyles: isSeriesData ? getSeriesLineStyles( data, index, providerTheme ) : {},
				glyph: providerTheme.glyphs?.[ index ],
				shapeStyles: isSeriesData
					? getItemShapeStyles( data, index, providerTheme, legendShape )
					: {},
			};
		},
		[ providerTheme, resolveColor ]
	);

	// Series visibility management methods
	const toggleSeriesVisibility = useCallback( ( chartId: string, seriesLabel: string ) => {
		setHiddenSeries( prev => {
			const newMap = new Map( prev );
			const chartHidden = newMap.get( chartId ) || new Set();
			const newSet = new Set( chartHidden );

			if ( newSet.has( seriesLabel ) ) {
				newSet.delete( seriesLabel );
			} else {
				newSet.add( seriesLabel );
			}

			if ( newSet.size === 0 ) {
				newMap.delete( chartId );
			} else {
				newMap.set( chartId, newSet );
			}

			return newMap;
		} );
	}, [] );

	const isSeriesVisible = useCallback(
		( chartId: string, seriesLabel: string ) => {
			const chartHidden = hiddenSeries.get( chartId );
			return ! chartHidden || ! chartHidden.has( seriesLabel );
		},
		[ hiddenSeries ]
	);

	const getHiddenSeries = useCallback(
		( chartId: string ): Set< string > => {
			const set = hiddenSeries.get( chartId );
			return set ? new Set( set ) : new Set< string >();
		},
		[ hiddenSeries ]
	);

	const value: GlobalChartsContextValue = useMemo(
		() => ( {
			charts,
			registerChart,
			unregisterChart,
			getChartData,
			theme: providerTheme,
			getElementStyles,
			toggleSeriesVisibility,
			isSeriesVisible,
			getHiddenSeries,
		} ),
		[
			charts,
			registerChart,
			unregisterChart,
			getChartData,
			providerTheme,
			getElementStyles,
			toggleSeriesVisibility,
			isSeriesVisible,
			getHiddenSeries,
		]
	);

	return (
		<GlobalChartsContext.Provider value={ value }>
			<div ref={ wrapperRef } style={ { display: 'contents' } }>
				{ children }
			</div>
		</GlobalChartsContext.Provider>
	);
};
