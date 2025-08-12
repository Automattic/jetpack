import { createContext, useContext, useCallback, useState, useMemo } from 'react';
import type { ChartContextValue, ChartRegistration } from './types';
import type { FC, ReactNode } from 'react';

export const GlobalChartsContext = createContext< ChartContextValue | null >( null );

export interface GlobalChartsProviderProps {
	children: ReactNode;
}

export const GlobalChartsProvider: FC< GlobalChartsProviderProps > = ( { children } ) => {
	const [ charts, setCharts ] = useState< Map< string, ChartRegistration > >( () => new Map() );

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
		} ),
		[ charts, registerChart, unregisterChart, getChartData ]
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
