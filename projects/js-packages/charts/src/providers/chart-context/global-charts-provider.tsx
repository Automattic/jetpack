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

	const value: ChartContextValue = useMemo(
		() => ( {
			charts,
			registerChart,
			unregisterChart,
			getChartData,
			theme: providerTheme,
		} ),
		[ charts, registerChart, unregisterChart, getChartData, providerTheme ]
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
