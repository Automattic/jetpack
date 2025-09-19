import { createContext, useCallback, useMemo, useState, useEffect } from 'react';
import { getItemShapeStyles, getSeriesLineStyles, mergeThemes } from '../../utils';
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

			const { colors } = providerTheme;

			// If group provided, maintain a stable assignment
			if ( group ) {
				const existing = groupToColorMap.get( group );
				if ( existing ) {
					return existing;
				}
				// Assign next color from palette in a deterministic cycling manner

				const assignedCount = groupToColorMap.size;
				const color = colors.length > 0 ? colors[ assignedCount % colors.length ] : '#000000';
				groupToColorMap.set( group, color );
				return color;
			}

			// Fallback: index-based color cycling
			return colors.length > 0 ? colors[ ( index || 0 ) % colors.length ] : '#000000';
		},
		[ providerTheme, groupToColorMap ]
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
