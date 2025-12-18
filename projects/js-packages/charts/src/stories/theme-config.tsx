import { defaultTheme } from '../providers';
import type { ChartTheme } from '../types';

/**
 * Default accent color for custom theme in Storybook
 */
export const DEFAULT_ACCENT_COLOR = '#4a19ab';

/**
 * Custom theme using a CSS variable for dynamic color generation
 */
export const customTheme: ChartTheme = {
	colors: [ 'var(--wpds-color-bg-interactive-brand)' ],
	seriesLineStyles: [
		{},
		{
			strokeDasharray: '5 8',
		},
	],
	geoChart: {
		featureFillColor: '#ffffff',
	},
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
	custom: customTheme,
};

/**
 * Shared argTypes for theme control
 */
export const themeArgTypes = {
	themeName: {
		control: { type: 'select' as const },
		options: Object.keys( CHART_THEME_MAP ),
		defaultValue: 'default',
		description: 'Select a theme to apply to the chart',
		table: { category: 'Theme' },
	},
	accentColor: {
		control: { type: 'color' as const },
		description: 'Accent color for the custom theme (used for primary chart elements)',
		defaultValue: DEFAULT_ACCENT_COLOR,
		table: { category: 'Theme' },
		if: { arg: 'themeName', eq: 'custom' },
	},
};

/**
 * Shared default args for theme-related controls in chart stories
 * These provide actual default values that appear in Storybook controls
 */
export const sharedThemeArgs = {
	themeName: 'default',
	accentColor: DEFAULT_ACCENT_COLOR,
} as const;
