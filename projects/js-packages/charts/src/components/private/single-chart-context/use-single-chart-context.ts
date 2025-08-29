import { useContext } from 'react';
import { ChartInstanceContextValue, ChartInstanceContext } from './single-chart-context';

export const useChartInstanceContext = (): ChartInstanceContextValue => {
	const context = useContext( ChartInstanceContext );
	if ( ! context ) {
		throw new Error( 'useChartInstanceContext must be used within a Chart component' );
	}
	return context;
};

export const useSingleChartContext = useChartInstanceContext;
