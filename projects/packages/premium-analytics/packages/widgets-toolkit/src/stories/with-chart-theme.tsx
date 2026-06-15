import { GlobalChartsProvider } from '@automattic/charts';
import { useChartTheme } from '../hooks';
import type { Decorator } from '@storybook/react';
import type { ReactNode } from 'react';

/**
 * Wraps children in a `GlobalChartsProvider` seeded with the Woo chart theme.
 * Mirrors what `WidgetRoot` does in the app, where the provider lives at the
 * top of the widget tree.
 *
 * @param props          - Component props.
 * @param props.children - The subtree to render inside the provider.
 * @return The themed chart provider wrapping `children`.
 */
const ChartThemeProvider = ( { children }: { children: ReactNode } ) => {
	const theme = useChartTheme();

	return <GlobalChartsProvider theme={ theme }>{ children }</GlobalChartsProvider>;
};

/**
 * Storybook decorator that supplies the charts context.
 *
 * Component-level stories that render a chart primitive from
 * `@automattic/charts` (or call `useGlobalChartsContext` directly) render
 * outside of `WidgetRoot`, so without this they throw
 * "useGlobalChartsContext must be used within a GlobalChartsProvider".
 *
 * @param Story - The story being decorated.
 * @return The story wrapped in a themed `GlobalChartsProvider`.
 */
export const withChartTheme: Decorator = Story => (
	<ChartThemeProvider>
		<Story />
	</ChartThemeProvider>
);
