import { createContext, useContext } from 'react';
import type { ChartTheme } from '../../types';
import type { FC, ReactNode } from 'react';

/**
 * Context for sharing theme configuration across components
 */
const ThemeContext = createContext< Partial< ChartTheme > >( {} );

/**
 * Hook to access chart theme
 * @return {object} A built theme configuration compatible with visx charts
 */
const useChartTheme = () => {
	const theme = useContext( ThemeContext );
	return theme;
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
	return <ThemeContext.Provider value={ theme }>{ children }</ThemeContext.Provider>;
};

export { ThemeProvider, useChartTheme };
