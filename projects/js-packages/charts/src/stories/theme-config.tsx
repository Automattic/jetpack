import { defaultTheme, jetpackTheme, wooTheme } from '../providers';
import type { ChartTheme } from '../types';

/**
 * Custom theme with earth tones and dashed line styles for demonstration
 */
export const customTheme: ChartTheme = {
	colors: [ 'var(--wpds-color-bg-interactive-brand-strong)' ],
	seriesLineStyles: [
		{},
		{
			strokeDasharray: '5 8',
		},
	],
	gridStyles: {
		stroke: '#ffe3e3',
		strokeWidth: 2,
	},
} as ChartTheme;

/**
 * Centralized theme map for all chart stories
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
	accentColor: {
		control: { type: 'color' as const },
		description: 'Accent color for the custom theme (used for primary chart elements)',
		defaultValue: '#c029dc',
		table: { category: 'Theme' },
		if: { arg: 'themeName', eq: 'custom' },
	},
};
