import { defaultTheme } from '../providers';
import type { ChartTheme } from '../types';

/**
 * Default accent color for custom theme in Storybook
 */
export const DEFAULT_ACCENT_COLOR = '#4a19ab';

/**
 * Custom theme demonstrating that the series palette needs no configuration to follow a
 * `ThemeProvider`.
 *
 * Moving the `accentColor` control moves the whole palette — the seeded series directly, and the
 * generated ones because they derive from it.
 *
 * It reaches the palette through `--wp-admin-theme-color`, which `ThemeProvider` writes from
 * its `color.primary` seed as a legacy wp-admin override, and which slot 1 reads first — not
 * through the `--wpds-*` ramp it also emits. So setting `adminColorScheme` to anything but
 * `none` publishes a closer `--wp-admin-theme-color` and the accent control stops driving the
 * palette. That is the documented cascade, not a bug.
 *
 * The color fields below are deprecated, and stay here because the control has to exercise the
 * `theme` route for as long as it exists. Do not copy this shape into docs — see `TOKENS.md`.
 */
export const customTheme: ChartTheme = {
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
 *
 * One color per format, and exactly as many as there are palette slots: a sixth entry would
 * be dropped with a console warning without covering a format the first five miss.
 *
 * Deliberately the densest use of the deprecated `theme` color fields in the package: the
 * normalization it tests runs on that route. Not a recommended theme shape.
 */
export const mixedColorFormatsTheme: ChartTheme = {
	colors: [
		'#e63946',
		'rgb(42, 157, 143)',
		'hsl(48, 96%, 53%)',
		'rgba(38, 70, 83, 0.9)',
		'steelblue',
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
 * The `--wp-admin-theme-color` each WordPress admin color scheme publishes, copied from
 * `@wordpress/base-styles`' `admin-schemes.css`.
 *
 * `fresh` and `default` have no `admin-color-*` block of their own and take the `:root` value,
 * so they are absent here rather than duplicated.
 */
export const WP_ADMIN_COLOR_SCHEMES: Record< string, string > = {
	light: '#007cba',
	modern: '#3858e9',
	blue: '#437aa8',
	coffee: '#916745',
	ectoplasm: '#646c3e',
	midnight: '#cf4339',
	ocean: '#567958',
	sunrise: '#ad631e',
};

/** The `adminColorScheme` value meaning "leave the design system in charge". */
export const NO_ADMIN_COLOR_SCHEME = 'none';

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
	adminColorScheme: {
		control: { type: 'select' as const },
		options: [ NO_ADMIN_COLOR_SCHEME, ...Object.keys( WP_ADMIN_COLOR_SCHEMES ) ],
		defaultValue: NO_ADMIN_COLOR_SCHEME,
		description:
			'Simulate a wp-admin color scheme by setting --wp-admin-theme-color, the way admin-schemes.css does. The series palette reads it first, so series colors follow the scheme.',
		table: { category: 'Theme' },
	},
};

export const sharedThemeArgs = {
	themeName: 'default',
	accentColor: DEFAULT_ACCENT_COLOR,
	adminColorScheme: NO_ADMIN_COLOR_SCHEME,
} as const;
