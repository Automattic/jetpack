import { useContext, useMemo } from 'react';
import { GlobalChartsContext } from '../providers/chart-context/global-charts-provider';
import { useChartTheme as useLocalChartTheme } from '../providers/theme';
import { defaultTheme } from '../providers/theme/themes';
import { mergeThemes } from '../utils/merge-themes';
import type { ChartTheme } from '../types';

/**
 * Hook to get the effective chart theme, prioritizing global theme over local theme.
 *
 * This hook combines the global theme from GlobalChartsProvider with the local theme
 * from ThemeProvider, giving priority to the global theme when available.
 *
 * @return The effective chart theme to use
 */
export const useChartTheme = (): ChartTheme => {
	// Get context but don't throw if it doesn't exist (for testing or standalone usage)
	const context = useContext( GlobalChartsContext );
	const globalTheme = context?.theme;
	const localTheme = useLocalChartTheme();

	// Memoize the theme to prevent unnecessary re-renders
	const effectiveTheme = useMemo(
		() => mergeThemes( globalTheme ?? defaultTheme, localTheme ),
		[ globalTheme, localTheme ]
	);

	return effectiveTheme;
};
