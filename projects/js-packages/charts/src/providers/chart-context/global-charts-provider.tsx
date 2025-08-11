import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { defaultTheme } from '../theme/themes';
import type { ChartContextValue, ChartRegistration } from './types';
import type { ChartTheme } from '../../types';
import type { FC, ReactNode } from 'react';

export const GlobalChartsContext = createContext< ChartContextValue | null >( null );

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

	const providerTheme: ChartTheme = useMemo( () => ( { ...defaultTheme, ...theme } ), [ theme ] );

	// Stable group -> color mapping for this provider lifecycle
	const [ groupToColorMap ] = useState< Map< string, string > >( () => new Map() );

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

	const resolveGroupColor = useCallback< ChartContextValue[ 'resolveGroupColor' ] >(
		params => {
			const { group, index, seriesStroke } = params;

			// Highest precedence: explicit series stroke
			if ( seriesStroke ) {
				return seriesStroke;
			}

			// If group provided, maintain a stable assignment
			if ( group ) {
				const existing = groupToColorMap.get( group );
				if ( existing ) {
					return existing;
				}
				// Assign next color from palette in a deterministic cycling manner
				const palette = providerTheme.colors ?? [];
				const assignedCount = groupToColorMap.size;
				const color = palette.length > 0 ? palette[ assignedCount % palette.length ] : '#000000';
				groupToColorMap.set( group, color );
				return color;
			}

			// Fallback: index-based color cycling
			const palette = providerTheme.colors ?? [];
			return palette.length > 0 ? palette[ index % palette.length ] : '#000000';
		},
		[ groupToColorMap, providerTheme.colors ]
	);

	const value: ChartContextValue = useMemo(
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

export const useGlobalChartsContext = (): ChartContextValue => {
	const context = useContext( GlobalChartsContext );
	if ( ! context ) {
		throw new Error( 'useGlobalChartsContext must be used within a GlobalChartsProvider' );
	}
	return context;
};
