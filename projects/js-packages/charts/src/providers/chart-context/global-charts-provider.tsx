import { createContext, useCallback, useMemo, useState, useEffect } from 'react';
import { getItemShapeStyles, getSeriesLineStyles, mergeThemes, hexToHsl } from '../../utils';
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

	const providerTheme: CompleteChartTheme = useMemo( () => {
		return theme ? mergeThemes( defaultTheme, theme ) : defaultTheme;
	}, [ theme ] );

	// Cache expensive color computations that only change when theme colors change
	const colorCache: ColorCache = useMemo( () => {
		const { colors } = providerTheme;
		const hues: number[] = [];
		const existingHslColors: Array< [ number, number, number ] > = [];
		let minHue = 360;
		let maxHue = 0;

		// Process all colors once and cache the results
		if ( Array.isArray( colors ) ) {
			for ( const color of colors ) {
				if ( color && typeof color === 'string' && color.startsWith( '#' ) ) {
					const hslColor = hexToHsl( color );
					hues.push( hslColor[ 0 ] );
					existingHslColors.push( hslColor );
					minHue = Math.min( minHue, hslColor[ 0 ] );
					maxHue = Math.max( maxHue, hslColor[ 0 ] );
				}
			}
		}

		return {
			colors: colors || [],
			hues,
			existingHslColors,
			minHue,
			maxHue,
		};
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

			return colorCache.colors.length > 0 ? getChartColor( index, colorCache ) : '#000000';
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

	const value: GlobalChartsContextValue = useMemo(
		() => ( {
			charts,
			registerChart,
			unregisterChart,
			getChartData,
			theme: providerTheme,
			getElementStyles,
		} ),
		[ charts, registerChart, unregisterChart, getChartData, providerTheme, getElementStyles ]
	);

	return <GlobalChartsContext.Provider value={ value }>{ children }</GlobalChartsContext.Provider>;
};
