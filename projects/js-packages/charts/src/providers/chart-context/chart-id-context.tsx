import { createContext, useContext } from 'react';
import type { FC, ReactNode } from 'react';

/**
 * Context for sharing chartId from parent chart to child components
 * This enables true composition API where child components automatically
 * inherit the parent chart's ID without explicit props
 */
export const ChartIdContext = createContext< string | null >( null );

export interface ChartIdProviderProps {
	chartId: string;
	children: ReactNode;
}

/**
 * Provider component that shares chartId with child components
 * @param root0          - The props object
 * @param root0.chartId  - Unique identifier for the chart
 * @param root0.children - Child components to provide context to
 * @return JSX element wrapping children with chart ID context
 */
export const ChartIdProvider: FC< ChartIdProviderProps > = ( { chartId, children } ) => {
	return <ChartIdContext.Provider value={ chartId }>{ children }</ChartIdContext.Provider>;
};

ChartIdProvider.displayName = 'ChartIdProvider';

/**
 * Hook to get chartId from context
 * Returns null if not within a ChartIdProvider
 * @return The chart ID from context or null if not available
 */
export const useChartIdFromContext = (): string | null => {
	return useContext( ChartIdContext );
};
