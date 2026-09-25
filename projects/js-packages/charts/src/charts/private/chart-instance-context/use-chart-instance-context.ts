import { useContext } from 'react';
import { ChartInstanceContext, type ChartInstanceContextValue } from './chart-instance-context';

export const useChartInstanceContext = (): ChartInstanceContextValue => {
	const context = useContext( ChartInstanceContext );
	if ( ! context ) {
		throw new Error( 'useChartInstanceContext must be used within a Chart component' );
	}
	return context;
};
