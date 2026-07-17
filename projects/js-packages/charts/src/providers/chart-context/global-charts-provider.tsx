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
import {
	getItemShapeStyles,
	getSeriesBarStyles,
	getSeriesLineStyles,
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

	// Track if the color palette has been resolved from the DOM
	// Useful for animations that should only run after the color palette is resolved
	const [ isColorPaletteResolved, setIsColorPaletteResolved ] = useState( false );

	// Compute color cache after DOM is updated (so CSS variables are available)
	// Resolves CSS variables from the wrapper element's scope to handle scoped variables
	// Note: Only re-runs when providerTheme changes, not when wrapper element changes.
	// This is intentional, as wrapperRef is expected to be stable for the lifetime of the provider.
	useLayoutEffect( () => {
		setIsColorPaletteResolved( false );
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
					// Normalize color to hex format, handling CSS variables, RGB, HSL, etc.
					// This uses normalizeColorToHex which resolves CSS variables and converts
					// rgb(), rgba(), hsl() formats to hex
					const normalizedColor = normalizeColorToHex(
						color,
						wrapperRef.current,
						resolveCssVariable
					);

					// Only process valid hex colors
					if ( normalizedColor.startsWith( '#' ) ) {
						resolvedColors.push( normalizedColor );
						const hslColor = d3Hsl( normalizedColor );
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

		setColorCache( {
			colors: resolvedColors,
			hues,
			existingHslColors,
			minHue,
			maxHue,
		} );
	}, [ providerTheme ] );

	useEffect( () => {
		if ( colorCache.colors.length > 0 ) {
			setIsColorPaletteResolved( true );
		}
	}, [ colorCache ] );

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
				return normalizeColorToHex( overrideColor, wrapperRef.current, resolveCssVariable );
			}

			// If group provided, maintain a stable assignment
			if ( group ) {
				const existing = groupToColorMap.get( group );

				if ( existing ) {
					return existing;
				}

				// Use map size as index to assign colors sequentially (0, 1, 2...)
				// ensuring each new group gets the next available palette color
				const assignedCount = groupToColorMap.size;
				const color = getChartColor( assignedCount, colorCache );
				groupToColorMap.set( group, color );

				return color;
			}

			return getChartColor( index, colorCache );
		},
		[ colorCache, groupToColorMap ]
	);

	const resolveThemeColor = useCallback< GlobalChartsContextValue[ 'resolveThemeColor' ] >(
		value => ( value ? normalizeColorToHex( value, wrapperRef.current, resolveCssVariable ) : '' ),
		[]
	);

	const getElementStyles = useCallback< GlobalChartsContextValue[ 'getElementStyles' ] >(
		( { data, index, overrideColor, legendShape } ) => {
			const isSeriesData = data && typeof data === 'object' && 'data' in data && 'options' in data;
			// DataPointPercentage has a numeric 'value' directly, unlike SeriesData which has 'data' array
			const isPointPercentageData =
				data &&
				typeof data === 'object' &&
				'value' in data &&
				typeof data.value === 'number' &&
				! ( 'data' in data );

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
				barStyles: isSeriesData ? getSeriesBarStyles( data, index, providerTheme ) : {},
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
			resolveThemeColor,
			toggleSeriesVisibility,
			isSeriesVisible,
			getHiddenSeries,
			isColorPaletteResolved,
		} ),
		[
			charts,
			registerChart,
			unregisterChart,
			getChartData,
			providerTheme,
			getElementStyles,
			resolveThemeColor,
			toggleSeriesVisibility,
			isSeriesVisible,
			getHiddenSeries,
			isColorPaletteResolved,
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
