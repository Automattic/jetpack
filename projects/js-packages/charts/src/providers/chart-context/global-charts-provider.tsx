import { createContext, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { mergeThemes } from '../../utils';
import { defaultTheme } from '../theme/themes';
import type { GlobalChartsContextValue, ChartRegistration } from './types';
import type { ChartTheme, CompleteChartTheme } from '../../types';
import type { FC, ReactNode } from 'react';

export const GlobalChartsContext = createContext< GlobalChartsContextValue | null >( null );

export interface GlobalChartsProviderProps {
	children: ReactNode;
	/** Optional theme override. Considered static for provider lifecycle. */
	theme?: Partial< ChartTheme >;
}

export const GlobalChartsProvider: FC< GlobalChartsProviderProps > = ( {
	children,
	theme = {},
} ) => {
	const [ charts, setCharts ] = useState< Map< string, ChartRegistration > >( () => new Map() );

	const providerTheme: CompleteChartTheme = useMemo(
		() => mergeThemes( defaultTheme, theme ),
		[ theme ]
	);

	// Stable group -> color mapping for this provider lifecycle
	const groupToColorMapRef = useRef< Map< string, string > >( new Map() );

	// Reset group color mappings when theme changes
	useEffect( () => {
		groupToColorMapRef.current = new Map();
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

	const resolveGroupColor = useCallback< GlobalChartsContextValue[ 'resolveGroupColor' ] >(
		( { group, index, overrideColor } ) => {
			// Highest precedence: explicit series stroke
			if ( overrideColor ) {
				return overrideColor;
			}

			const palette = providerTheme.colors ?? [];

			// If group provided, maintain a stable assignment
			if ( group ) {
				const existing = groupToColorMapRef.current.get( group );
				if ( existing ) {
					return existing;
				}
				// Assign next color from palette in a deterministic cycling manner

				const assignedCount = groupToColorMapRef.current.size;
				const color = palette.length > 0 ? palette[ assignedCount % palette.length ] : '#000000';
				groupToColorMapRef.current.set( group, color );
				return color;
			}

			// Fallback: index-based color cycling
			return palette.length > 0 ? palette[ ( index || 0 ) % palette.length ] : '#000000';
		},
		[ providerTheme.colors ]
	);

	const value: GlobalChartsContextValue = useMemo(
		() => ( {
			charts,
			registerChart,
			unregisterChart,
			getChartData,
			theme: providerTheme,
			resolveGroupColor,
		} ),
		[ charts, registerChart, unregisterChart, getChartData, providerTheme, resolveGroupColor ]
	);

	return <GlobalChartsContext.Provider value={ value }>{ children }</GlobalChartsContext.Provider>;
};
