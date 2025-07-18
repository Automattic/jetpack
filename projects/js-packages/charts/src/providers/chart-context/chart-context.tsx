import { createContext, useContext, useCallback, useRef, useState, useMemo } from 'react';
import type { ChartContextValue, ChartRegistration } from './types';
import type { FC, ReactNode } from 'react';

export const ChartContext = createContext< ChartContextValue | null >( null );

export interface ChartProviderProps {
	children: ReactNode;
}

export const ChartProvider: FC< ChartProviderProps > = ( { children } ) => {
	const chartsRef = useRef< Map< string, ChartRegistration > >( new Map() );
	const [ version, setVersion ] = useState( 0 );

	const registerChart = useCallback( ( id: string, data: ChartRegistration ) => {
		chartsRef.current.set( id, data );
		setVersion( prev => prev + 1 );
	}, [] );

	const unregisterChart = useCallback( ( id: string ) => {
		chartsRef.current.delete( id );
		setVersion( prev => prev + 1 );
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
		// Only depend on version - the functions are stable from useCallback with empty deps
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ version ]
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
