import { useContext } from 'react';
import { GlobalChartsContext } from '../global-charts-provider';
import type { GlobalChartsContextValue } from '../types';

export const useGlobalChartsContext = (): GlobalChartsContextValue => {
	const context = useContext( GlobalChartsContext );
	if ( ! context ) {
		throw new Error( 'useGlobalChartsContext must be used within a GlobalChartsProvider' );
	}
	return context;
};
