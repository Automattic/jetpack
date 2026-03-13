import { useContext } from 'react';
import { GlobalChartsContext } from '../global-charts-provider';
import { defaultTheme } from '../themes';
import type { CompleteChartTheme } from '../../../types';

/**
 * Hook to get the global chart theme from GlobalChartsProvider
 *
 * @return The global chart theme
 */
export const useGlobalChartsTheme = (): CompleteChartTheme => {
	// Get context but don't throw if it doesn't exist (for testing or standalone usage)
	const context = useContext( GlobalChartsContext );
	const globalTheme = context?.theme;

	return globalTheme ?? defaultTheme;
};
