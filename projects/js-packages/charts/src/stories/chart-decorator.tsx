import { setLocale } from '@automattic/number-formatters';
import { ThemeProvider } from '@wordpress/theme';
import { useEffect, useRef, useCallback } from 'react';
import { GlobalChartsProvider } from '../providers';
import {
	CHART_THEME_MAP,
	CHART_THEME_ROLES,
	DEFAULT_ACCENT_COLOR,
	NO_ADMIN_COLOR_SCHEME,
	WP_ADMIN_COLOR_SCHEMES,
} from './theme-config';
import type { Decorator } from '@storybook/react';
import type { CSSProperties } from 'react';

/**
 * Generic StoryArgs type that extends any chart component props with themeName
 * This can be used by all chart stories to ensure consistent theming support
 */
export type ChartStoryArgs< T = Record< string, unknown > > = T & {
	themeName?: string;
	accentColor?: string;
	adminColorScheme?: string;
	containerWidth?: string;
	containerHeight?: string;
	showOffsetTestButtons?: boolean;
	resize?: 'none' | 'both' | 'horizontal' | 'vertical';
	withPadding?: boolean;
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
	const withPadding = args.withPadding !== false;
	const showOffsetTestButtons = args.showOffsetTestButtons === true;

	const StoryWithContainer = () => {
		const containerRef = useRef< HTMLDivElement >( null );
		const offsetRef = useRef( { x: 0, y: 0 } );

		// Direct DOM manipulation to move container without React re-render
		const moveContainer = useCallback( ( dx: number, dy: number ) => {
			if ( containerRef.current ) {
				offsetRef.current.x += dx;
				offsetRef.current.y += dy;
				containerRef.current.style.transform = `translate(${ offsetRef.current.x }px, ${ offsetRef.current.y }px)`;
			}
		}, [] );

		const resetPosition = useCallback( () => {
			if ( containerRef.current ) {
				offsetRef.current = { x: 0, y: 0 };
				containerRef.current.style.transform = '';
			}
		}, [] );

		const moveLeft = useCallback( () => moveContainer( -50, 0 ), [ moveContainer ] );
		const moveRight = useCallback( () => moveContainer( 50, 0 ), [ moveContainer ] );
		const moveUp = useCallback( () => moveContainer( 0, -50 ), [ moveContainer ] );
		const moveDown = useCallback( () => moveContainer( 0, 50 ), [ moveContainer ] );

		return (
			<>
				{ showOffsetTestButtons && (
					<div style={ { marginBottom: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' } }>
						<span style={ { fontSize: '12px', color: '#666', alignSelf: 'center' } }>
							Move container (no re-render):
						</span>
						<button type="button" onClick={ moveLeft }>
							← Left
						</button>
						<button type="button" onClick={ moveRight }>
							Right →
						</button>
						<button type="button" onClick={ moveUp }>
							↑ Up
						</button>
						<button type="button" onClick={ moveDown }>
							Down ↓
						</button>
						<button type="button" onClick={ resetPosition }>
							Reset
						</button>
					</div>
				) }
				<div
					ref={ containerRef }
					data-testid="chart-story-container"
					style={ {
						resize: args.resize || 'both',
						overflow: 'auto',
						padding: withPadding ? '1rem' : undefined,
						width: args.containerWidth || '800px',
						height: args.containerHeight || '400px',
						maxWidth: '1200px',
						border: '1px dashed #ccc',
						display: 'inline-block',
					} }
				>
					<Story />
				</div>
			</>
		);
	};

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
 * Reproduces a wp-admin color scheme for the subtree below it.
 *
 * One declaration, and it is the same one WordPress makes: `admin-schemes.css` sets
 * `--wp-admin-theme-color` on `body.admin-color-<scheme>`. The palette's slot 1 names that
 * variable first, so this is enough to exercise the whole path Storybook otherwise cannot —
 * every story renders a `ThemeProvider`, and without a scheme set the admin color it publishes
 * is whatever the provider's accent is.
 *
 * @param scheme - A key of `WP_ADMIN_COLOR_SCHEMES`, or `NO_ADMIN_COLOR_SCHEME`.
 * @return The wrapper's inline custom property, or undefined to leave the page as it is.
 */
const adminColorSchemeStyle = ( scheme: string ): CSSProperties | undefined => {
	const color = WP_ADMIN_COLOR_SCHEMES[ scheme ];

	if ( scheme === NO_ADMIN_COLOR_SCHEME || ! color ) {
		return undefined;
	}

	return { '--wp-admin-theme-color': color } as CSSProperties;
};

/**
 * Provider wrapper for Storybook chart stories
 * Handles theme setup, WPDS ThemeProvider, locale initialization, and GlobalChartsProvider.
 * Always wraps in ThemeProvider to mirror the real WordPress environment where
 * design-system tokens are expected to be available.
 * @param root0                  - Props object
 * @param root0.children         - Child components to render
 * @param root0.themeName        - Theme name to apply
 * @param root0.accentColor      - Accent color fed to WPDS ThemeProvider as primary seed
 * @param root0.adminColorScheme - wp-admin color scheme to simulate, or `none`
 * @return JSX element with chart environment setup and GlobalChartsProvider
 */
const StoryChartProvider = ( {
	children,
	themeName = 'default',
	accentColor = DEFAULT_ACCENT_COLOR,
	adminColorScheme = NO_ADMIN_COLOR_SCHEME,
}: {
	children: React.ReactNode;
	themeName?: string;
	accentColor?: string;
	adminColorScheme?: string;
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
	const roles = CHART_THEME_ROLES[ themeName ];

	// Only seed a custom primary color when the custom theme is active.
	// Other themes use ThemeProvider's built-in default.
	const sanitizedAccentColor = isValidHexColor( accentColor ) ? accentColor : DEFAULT_ACCENT_COLOR;
	const themeProviderColor = themeName === 'custom' ? { primary: sanitizedAccentColor } : undefined;

	// Force GlobalChartsProvider to remount when the accent color or the simulated admin scheme
	// changes. The palette is resolved once per provider in a layout effect, so without a remount
	// the seeds would keep the values they had when the wrapper first mounted.
	const providerKey = [
		themeName,
		themeName === 'custom' ? sanitizedAccentColor : '',
		adminColorScheme,
	].join( '-' );

	return (
		<ThemeProvider color={ themeProviderColor }>
			{ /*
				Storybook acts as a WPDS-themed host application so charts
				inherit the design system body font through normal CSS
				cascade.
			*/ }
			<div
				style={ {
					fontFamily:
						'var(--wpds-typography-font-family-body, -apple-system, system-ui, "Segoe UI", "Roboto", "Oxygen-Sans", "Ubuntu", "Cantarell", "Helvetica Neue", sans-serif)',
					...adminColorSchemeStyle( adminColorScheme ),
				} }
			>
				{ roles && (
					<style>{ `.a8c-charts-scope { ${ Object.entries( roles )
						.map( ( [ role, value ] ) => `${ role }: ${ value };` )
						.join( ' ' ) } }` }</style>
				) }
				<GlobalChartsProvider key={ providerKey } theme={ theme }>
					{ children }
				</GlobalChartsProvider>
			</div>
		</ThemeProvider>
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
	const adminColorScheme = storyArgs.adminColorScheme;

	return (
		<StoryChartProvider
			themeName={ themeName }
			accentColor={ accentColor }
			adminColorScheme={ adminColorScheme }
		>
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
	showOffsetTestButtons: {
		control: 'boolean',
		description:
			'Show buttons to move the container via DOM manipulation (no re-render) for testing tooltip positioning',
		table: { category: 'Testing' },
	},
	resize: {
		control: { type: 'select' },
		options: [ 'none', 'both', 'horizontal', 'vertical' ],
		description: 'Resize behavior for the chart container',
	},
} as const;
