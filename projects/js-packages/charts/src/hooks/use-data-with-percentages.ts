import { useMemo } from 'react';

interface DataPointWithValue {
	value: number;
}

/**
 * Hook to calculate percentages from values for chart data.
 * Ensures percentages are always derived from values (single source of truth).
 *
 * @param data - Array of data points with values
 * @return Data with calculated percentages
 */
export const useDataWithPercentages = < T extends DataPointWithValue >(
	data: T[]
): ( T & { percentage: number } )[] => {
	return useMemo( () => {
		const totalValue = data.reduce( ( sum, segment ) => sum + segment.value, 0 );
		return data.map( segment => ( {
			...segment,
			percentage: totalValue > 0 ? ( segment.value / totalValue ) * 100 : 0,
		} ) );
	}, [ data ] );
};
