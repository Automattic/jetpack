import { defaultTheme } from '../providers';
import type { ChartTheme } from '../types';

/**
 * Default accent color for custom theme in Storybook
 */
export const DEFAULT_ACCENT_COLOR = '#4a19ab';

/**
 * Custom theme using a CSS variable set by `ThemeProvider` for dynamic color generation.
 * The `--wpds-color-foreground-interactive-brand` token is set by wrapping
 * the component tree in a WPDS `ThemeProvider` with a `color.primary` seed.
 */
export const customTheme: ChartTheme = {
	colors: [ 'var(--wpds-color-foreground-interactive-brand)' ],
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
 * Theme that uses a variety of color formats (hex, RGB, RGBA, HSL, named)
 * to demonstrate and test color normalization support.
 */
export const mixedColorFormatsTheme: ChartTheme = {
	colors: [
		'#e63946',
		'rgb(42, 157, 143)',
		'hsl(48, 96%, 53%)',
		'rgba(38, 70, 83, 0.9)',
		'steelblue',
		'hsl(280, 60%, 50%)',
		'rgb(244, 162, 97)',
	],
	backgroundColor: 'hsl(0, 0%, 98%)',
	gridColor: 'rgba(0, 0, 0, 0.1)',
	gridColorDark: 'rgba(255, 255, 255, 0.15)',
	gridStyles: {
		stroke: 'rgb(200, 200, 200)',
		strokeWidth: 1,
	},
	geoChart: {
		featureFillColor: 'hsl(0, 0%, 93%)',
	},
	leaderboardChart: {
		primaryColor: 'rgb(42, 157, 143)',
		secondaryColor: 'rgb(148, 206, 199)',
		deltaColors: [ 'hsl(0, 70%, 50%)', 'rgb(150, 150, 150)', '#2a9d8f' ],
	},
	conversionFunnelChart: {
		primaryColor: 'hsl(200, 60%, 45%)',
		positiveChangeColor: 'rgb(42, 157, 143)',
		negativeChangeColor: 'hsl(0, 70%, 50%)',
	},
} as ChartTheme;

/**
 * Centralized theme map for all chart stories
 */
export const CHART_THEME_MAP: Record< string, ChartTheme | undefined > = {
	default: defaultTheme,
	custom: customTheme,
	'mixed-color-formats': mixedColorFormatsTheme,
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

export const sharedThemeArgs = {
	themeName: 'default',
	accentColor: DEFAULT_ACCENT_COLOR,
} as const;
