import { setLocale } from '@automattic/number-formatters';
import { useEffect } from 'react';
import { GlobalChartsProvider } from '../providers';
import { CHART_THEME_MAP, DEFAULT_ACCENT_COLOR } from './theme-config';
import type { Decorator } from '@storybook/react';

/**
 * Generic StoryArgs type that extends any chart component props with themeName
 * This can be used by all chart stories to ensure consistent theming support
 */
export type ChartStoryArgs< T = Record< string, unknown > > = T & {
	themeName?: string;
	accentColor?: string;
	containerWidth?: string;
	containerHeight?: string;
	resize?: 'none' | 'both' | 'horizontal' | 'vertical';
};

/**
 * Shared decorator for chart stories with GlobalChartsProvider and dynamic theme support
 * Provides a resizable container for testing responsive behavior
 * Composes with simpleChartDecorator to add container styling
 * Supports configurable container dimensions via containerWidth/containerHeight args
 * @param Story   - The story component to render
 * @param context - The full story context object
 * @return The decorated story component wrapped in GlobalChartsProvider and container
 */
export const chartDecorator: Decorator = ( Story, context ) => {
	const args = context.args as ChartStoryArgs;

	const StoryWithContainer = () => (
		<div
			style={ {
				resize: args.resize || 'both',
				overflow: 'auto',
				padding: '1rem',
				width: args.containerWidth || '800px',
				height: args.containerHeight,
				maxWidth: '1200px',
				border: '1px dashed #ccc',
				display: 'inline-block',
			} }
		>
			<Story />
		</div>
	);

	return simpleChartDecorator( StoryWithContainer, context );
};

/**
 * Validates that a string is a safe hex color value
 * Prevents XSS by ensuring only valid hex colors are used in CSS
 * @param color - Color string to validate
 * @return true if the color is a valid hex format (#RGB or #RRGGBB)
 */
const isValidHexColor = ( color: string ): boolean => {
	return /^#[0-9A-Fa-f]{3}$|^#[0-9A-Fa-f]{6}$/.test( color );
};

/**
 * Provider wrapper for Storybook chart stories
 * Handles theme setup, CSS variables for custom theme, locale initialization, and GlobalChartsProvider
 * @param root0             - Props object
 * @param root0.children    - Child components to render
 * @param root0.themeName   - Theme name to apply
 * @param root0.accentColor - Accent color for custom theme (injected as CSS variable)
 * @return JSX element with chart environment setup and GlobalChartsProvider
 */
const StoryChartProvider = ( {
	children,
	themeName = 'default',
	accentColor = DEFAULT_ACCENT_COLOR,
}: {
	children: React.ReactNode;
	themeName?: string;
	accentColor?: string;
} ) => {
	// Initialize number formatters with browser locale for Storybook
	// In WordPress, @automattic/number-formatters automatically uses the WordPress user locale
	// from @wordpress/date's getSettings(), so no explicit setLocale() call is needed
	useEffect( () => {
		if ( typeof window !== 'undefined' && window.navigator?.language ) {
			setLocale( window.navigator.language );
		}
	}, [] );

	const theme = CHART_THEME_MAP[ themeName ];

	// Sanitize accent color to prevent XSS via CSS injection
	// Falls back to default if invalid hex color is provided
	const sanitizedAccentColor = isValidHexColor( accentColor ) ? accentColor : DEFAULT_ACCENT_COLOR;

	// Force GlobalChartsProvider to remount when accent color changes for custom theme
	// This ensures CSS variables are re-resolved after the DOM updates
	const providerKey = themeName === 'custom' ? `custom-${ sanitizedAccentColor }` : themeName;

	return (
		<>
			{ themeName === 'custom' && (
				<style>
					{ `
						:root {
							--wpds-color-bg-interactive-brand: ${ sanitizedAccentColor };
						}
					` }
				</style>
			) }
			<GlobalChartsProvider key={ providerKey } theme={ theme }>
				{ children }
			</GlobalChartsProvider>
		</>
	);
};

/**
 * Simple decorator for chart context stories with GlobalChartsProvider but no container styling
 * Used for stories that display multiple charts in custom layouts
 * Ensures number formatters use browser locale in Storybook environment
 * @param Story      - The story component to render
 * @param root0      - The story context object
 * @param root0.args - The story arguments
 * @return The story component wrapped in GlobalChartsProvider only
 */
export const simpleChartDecorator: Decorator = ( Story, { args } ) => {
	const storyArgs = args as unknown as ChartStoryArgs;
	const themeName = storyArgs.themeName;
	const accentColor = storyArgs.accentColor;

	return (
		<StoryChartProvider themeName={ themeName } accentColor={ accentColor }>
			<Story />
		</StoryChartProvider>
	);
};

/**
 * Shared argTypes for common chart controls (dimensions, container settings)
 */
export const sharedChartArgTypes = {
	maxWidth: {
		control: {
			type: 'number',
			min: 100,
			max: 1200,
		},
		description: 'Maximum width of the chart in pixels (responsive mode)',
		table: { category: 'Dimensions' },
	},
	aspectRatio: {
		control: {
			type: 'number',
			min: 0,
			max: 1,
		},
		description: 'Height as a ratio of width (0-1, responsive mode)',
		table: { category: 'Dimensions' },
	},
	resizeDebounceTime: {
		control: {
			type: 'number',
			min: 0,
			max: 10000,
		},
		description: 'Debounce time in ms for resize events (performance)',
		table: { category: 'Performance' },
	},
	containerWidth: {
		control: { type: 'text' },
		description: 'CSS width value for the chart container (e.g., "400px", "100%")',
	},
	containerHeight: {
		control: { type: 'text' },
		description: 'CSS height value for the chart container (e.g., "400px", "100%")',
	},
	resize: {
		control: { type: 'select' },
		options: [ 'none', 'both', 'horizontal', 'vertical' ],
		description: 'Resize behavior for the chart container',
	},
} as const;
