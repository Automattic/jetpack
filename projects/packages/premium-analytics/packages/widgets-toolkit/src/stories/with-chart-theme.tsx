import { ChartsProvider } from '../components/charts-provider';
import { applyFixtureSiteSettings } from './fixture-site';
import type { Decorator } from '@storybook/react';

applyFixtureSiteSettings();

/**
 * Storybook decorator that supplies the charts context.
 *
 * Component-level stories that render a chart primitive from
 * `@automattic/charts` (or call `useGlobalChartsContext` directly) render
 * outside of `WidgetRoot`, so without this they throw
 * "useGlobalChartsContext must be used within a GlobalChartsProvider".
 *
 * @param Story - The story being decorated.
 * @return The story wrapped in the app's `ChartsProvider`.
 */
export const withChartTheme: Decorator = Story => (
	<ChartsProvider>
		<Story />
	</ChartsProvider>
);
