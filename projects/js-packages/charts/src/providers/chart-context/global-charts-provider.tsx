import {
	createContext,
	useCallback,
	useMemo,
	useState,
	useEffect,
	useLayoutEffect,
	useRef,
} from 'react';
import {
	getItemShapeStyles,
	getSeriesLineStyles,
	mergeThemes,
	hexToHsl,
	resolveCssVariable,
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
}

export const GlobalChartsProvider: FC< GlobalChartsProviderProps > = ( { children, theme } ) => {
	const [ charts, setCharts ] = useState< Map< string, ChartRegistration > >( () => new Map() );
	// Track hidden series per chart: chartId -> Set<seriesLabel>
	const [ hiddenSeries, setHiddenSeries ] = useState< Map< string, Set< string > > >(
		() => new Map()
	);

	// Ref to the wrapper element for resolving scoped CSS variables
	const wrapperRef = useRef< HTMLDivElement >( null );

	const providerTheme: CompleteChartTheme = useMemo( () => {
		return theme ? mergeThemes( defaultTheme, theme ) : defaultTheme;
	}, [ theme ] );

	// Cache expensive color computations that only change when theme colors change
	// Using useState + useLayoutEffect instead of useMemo to ensure CSS variables
	// in <style> tags are applied to the DOM before we try to resolve them
	const [ colorCache, setColorCache ] = useState< ColorCache >( () => ( {
		colors: [],
		hues: [],
		existingHslColors: [],
		minHue: 360,
		maxHue: 0,
	} ) );

	// Compute color cache after DOM is updated (so CSS variables are available)
	// Resolves CSS variables from the wrapper element's scope to handle scoped variables
	// Note: Only re-runs when providerTheme changes, not when wrapper element changes.
	// This is intentional, as wrapperRef is expected to be stable for the lifetime of the provider.
	useLayoutEffect( () => {
		const { colors } = providerTheme;
		const resolvedColors: string[] = [];
		const hues: number[] = [];
		const existingHslColors: Array< [ number, number, number ] > = [];
		let minHue = 360;
		let maxHue = 0;

		// Process all colors once and cache the results
		if ( Array.isArray( colors ) ) {
			for ( const color of colors ) {
				if ( color && typeof color === 'string' ) {
					let colorValue = color;

					// Handle CSS custom properties names - resolve them to actual values
					// Use wrapper element to resolve scoped CSS variables
					if ( color.startsWith( '--' ) ) {
						const resolved = resolveCssVariable( color, wrapperRef.current );

						if ( resolved === null || resolved === '' ) {
							continue;
						}

						colorValue = resolved;
					}

					// Process hex colors
					if ( colorValue.startsWith( '#' ) ) {
						resolvedColors.push( colorValue );
						try {
							const hslColor = hexToHsl( colorValue );
							hues.push( hslColor[ 0 ] );
							existingHslColors.push( hslColor );
							minHue = Math.min( minHue, hslColor[ 0 ] );
							maxHue = Math.max( maxHue, hslColor[ 0 ] );
						} catch {
							// Ignore invalid hex colors that don't parse to HSL
							continue;
						}
					}
				}
			}
		}

		setColorCache( {
			colors: resolvedColors,
			hues,
			existingHslColors,
			minHue,
			maxHue,
		} );
	}, [ providerTheme ] );

	const [ groupToColorMap, setGroupToColorMap ] = useState< Map< string, string > >(
		() => new Map()
	);

	// Reset group color mappings when theme colors change
	useEffect( () => {
		// Create a completely new Map instance to trigger dependencies, e.g. useChartLegendItems
		setGroupToColorMap( new Map() );
	}, [ providerTheme.colors ] );

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
				return overrideColor;
			}

			// If group provided, maintain a stable assignment
			if ( group ) {
				const existing = groupToColorMap.get( group );

				if ( existing ) {
					return existing;
				}

				const assignedCount = groupToColorMap.size;
				const color =
					colorCache.colors.length > 0 ? getChartColor( assignedCount, colorCache ) : '#000000';
				groupToColorMap.set( group, color );

				return color;
			}

			return getChartColor( index, colorCache );
		},
		[ colorCache, groupToColorMap ]
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
