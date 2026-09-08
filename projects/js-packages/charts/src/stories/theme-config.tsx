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
 */
export const customTheme: ChartTheme = {
	seriesLineStyles: [
		{},
		{
			strokeDasharray: '5 8',
		},
	],
	gridStyles: {
		strokeWidth: 2,
	},
} as ChartTheme;

/** The catalog roles the `custom` theme moves. Colors have no theme field; they are set in CSS. */
export const customThemeRoles: Record< string, string > = {
	'--a8c-charts-color-grid': '#ffe3e3',
	'--a8c-charts-color-surface-secondary': '#ffffff',
};

/**
 * Roles set in a variety of color formats (hex, RGB, RGBA, HSL, named) to demonstrate and test
 * color normalization.
 *
 * One format per palette slot, and exactly as many as there are slots: a sixth would resolve to
 * nothing without covering a format the first five miss.
 */
export const mixedColorFormatRoles: Record< string, string > = {
	'--a8c-charts-color-series-1': '#e63946',
	'--a8c-charts-color-series-2': 'rgb(42, 157, 143)',
	'--a8c-charts-color-series-3': 'hsl(48, 96%, 53%)',
	'--a8c-charts-color-series-4': 'rgba(38, 70, 83, 0.9)',
	'--a8c-charts-color-series-5': 'steelblue',
	'--a8c-charts-color-background': 'hsl(0, 0%, 98%)',
	'--a8c-charts-color-grid': 'rgb(200, 200, 200)',
	'--a8c-charts-color-surface-secondary': 'hsl(0, 0%, 93%)',
	'--a8c-charts-color-trend-up': '#2a9d8f',
	'--a8c-charts-color-trend-down': 'hsl(0, 70%, 50%)',
	'--a8c-charts-color-trend-neutral': 'rgb(150, 150, 150)',
};

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
	'mixed-color-formats': undefined,
};

/**
 * The catalog roles each theme declares.
 *
 * Applied as a rule on `.a8c-charts-scope` rather than inline on an ancestor: the catalog is
 * declared on the provider's own wrapper, and an element's own declaration beats one it merely
 * inherits, so an ancestor's value would never be seen. That rule is also the one route
 * the JS-read roles — the palette above all — can travel, since the provider resolves
 * them at that same wrapper.
 */
export const CHART_THEME_ROLES: Record< string, Record< string, string > | undefined > = {
	default: undefined,
	custom: customThemeRoles,
	'mixed-color-formats': mixedColorFormatRoles,
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
