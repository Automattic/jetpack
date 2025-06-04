import { buildChartTheme } from '@visx/xychart';
import { createContext, useContext, useMemo } from 'react';
import { defaultTheme } from './themes';
import type { ChartTheme, SeriesData } from '../../types';
import type { FC, ReactNode } from 'react';

/**
 * Context for sharing theme configuration across components
 */
const ThemeContext = createContext< ChartTheme >( defaultTheme );

/**
 * Hook to access chart theme
 * @return {object} A built theme configuration compatible with visx charts
 */
const useChartTheme = () => {
	const theme = useContext( ThemeContext );
	return theme;
};

const useXYChartTheme = ( data: SeriesData[] ) => {
	const providerTheme = useChartTheme();

	return useMemo( () => {
		const seriesColors = ( data ?? [] )
			.map( series => series.options?.stroke )
			.filter( ( color ): color is string => Boolean( color ) );

		return buildChartTheme( {
			...providerTheme,
			colors: [ ...seriesColors, ...( providerTheme.colors ?? [] ) ],
		} );
	}, [ providerTheme, data ] );
};

/**
 * Props for the ThemeProvider component
 */
type ThemeProviderProps = {
	/** Optional partial theme override */
	theme?: Partial< ChartTheme >;
	/** Child components that will have access to the theme */
	children: ReactNode;
};

// Provider component for chart theming
// Allows theme customization through props while maintaining default values
const ThemeProvider: FC< ThemeProviderProps > = ( { theme = {}, children } ) => {
	const mergedTheme = { ...defaultTheme, ...theme };
	return <ThemeContext.Provider value={ mergedTheme }>{ children }</ThemeContext.Provider>;
};

export { ThemeProvider, useChartTheme, useXYChartTheme };
