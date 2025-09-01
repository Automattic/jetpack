import { defaultTheme, jetpackTheme, wooTheme } from '../providers/theme/themes';
import type { ChartTheme } from '../types';

/**
 * Custom theme with earth tones and dashed line styles for demonstration
 */
export const customTheme: ChartTheme = {
	colors: [ '#073B3A', '#0B6E4F', '#08A045', '#6BBF59', '#DDB771' ],
	seriesLineStyles: [
		{
			strokeWidth: 1,
			strokeDasharray: '8 8',
			strokeLinecap: 'square',
		},
		{
			strokeDasharray: '5 8',
			strokeWidth: 2,
			strokeLinecap: 'square',
		},
	],
	gridStyles: {
		stroke: '#ffe3e3',
		strokeWidth: 2,
	},
} as ChartTheme;

/**
 * Centralized theme map for all chart stories
 * Note: customStorybook theme is added by line chart stories
 */
export const CHART_THEME_MAP: Record< string, ChartTheme | undefined > = {
	default: defaultTheme,
	jetpack: jetpackTheme,
	woo: wooTheme,
	custom: customTheme,
};

/**
 * Shared argTypes for theme control
 */
export const themeArgTypes = {
	themeName: {
		control: { type: 'select' as const },
		options: [ 'default', 'jetpack', 'woo', 'custom' ],
		defaultValue: 'default',
		description: 'Select a theme to apply to the chart',
		table: { category: 'Theme' },
	},
};
