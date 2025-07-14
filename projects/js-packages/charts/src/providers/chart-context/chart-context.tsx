import { createContext, useContext, useCallback, useState, useMemo } from 'react';
import type { ChartContextValue, ChartRegistration } from './types';
import type { FC, ReactNode } from 'react';

export const ChartContext = createContext< ChartContextValue | null >( null );

export interface ChartProviderProps {
	children: ReactNode;
}

export const ChartProvider: FC< ChartProviderProps > = ( { children } ) => {
	const [ charts, setCharts ] = useState< Map< string, ChartRegistration > >( new Map() );

	const registerChart = useCallback( ( id: string, data: ChartRegistration ) => {
		setCharts( prev => {
			const newMap = new Map( prev );
			newMap.set( id, data );
			return newMap;
		} );
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

	return <ChartContext.Provider value={ value }>{ children }</ChartContext.Provider>;
};

export const useChartContext = (): ChartContextValue => {
	const context = useContext( ChartContext );
	if ( ! context ) {
		throw new Error( 'useChartContext must be used within a ChartProvider' );
	}
	return context;
};
