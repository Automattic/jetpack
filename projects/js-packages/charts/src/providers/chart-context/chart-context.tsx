import { createContext, useContext, useCallback, useRef, useMemo } from 'react';
import type { ChartContextValue, ChartRegistration } from './types';
import type { FC, ReactNode } from 'react';

const ChartContext = createContext< ChartContextValue | null >( null );

export interface ChartProviderProps {
	children: ReactNode;
}

export const ChartProvider: FC< ChartProviderProps > = ( { children } ) => {
	const chartsRef = useRef< Map< string, ChartRegistration > >( new Map() );

	const registerChart = useCallback( ( id: string, data: ChartRegistration ) => {
		chartsRef.current.set( id, data );
	}, [] );

	const unregisterChart = useCallback( ( id: string ) => {
		chartsRef.current.delete( id );
	}, [] );

	const getChartData = useCallback( ( id: string ) => {
		return chartsRef.current.get( id );
	}, [] );

	const value: ChartContextValue = useMemo(
		() => ( {
			charts: chartsRef.current,
			registerChart,
			unregisterChart,
			getChartData,
		} ),
		[ registerChart, unregisterChart, getChartData ]
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
