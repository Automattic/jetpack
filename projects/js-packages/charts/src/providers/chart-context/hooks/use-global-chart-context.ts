import { useContext } from 'react';
import { GlobalChartsContext } from '../global-charts-provider';
import type { ChartContextValue } from '../types';

export const useGlobalChartContext = (): ChartContextValue => {
	const context = useContext( GlobalChartsContext );
	if ( ! context ) {
		throw new Error( 'useGlobalChartContext must be used within a GlobalChartsProvider' );
	}
	return context;
};
