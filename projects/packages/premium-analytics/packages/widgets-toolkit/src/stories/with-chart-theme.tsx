import { GlobalChartsProvider } from '@jetpack-premium-analytics/externals';
import { siteChartFormatting } from '../helpers';
import { useChartTheme } from '../hooks';
import { applyFixtureSiteSettings } from './fixture-site';
import type { Decorator } from '@storybook/react';
import type { ReactNode } from 'react';

applyFixtureSiteSettings();

/**
 * Wraps children in a `GlobalChartsProvider` seeded with the Woo chart theme and
 * the site's chart formatting, as `WidgetRoot` does in the app.
 *
 * @return The themed chart provider wrapping `children`.
 */
const ChartThemeProvider = ( { children }: { children: ReactNode } ) => {
	const theme = useChartTheme();

	return (
		<GlobalChartsProvider theme={ theme } { ...siteChartFormatting() }>
			{ children }
		</GlobalChartsProvider>
	);
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
