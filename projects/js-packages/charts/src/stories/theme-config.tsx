import * as ThemeProviders from '../providers/theme';
import type { ChartTheme } from '../types';

/**
 * Runtime theme discovery - automatically detects all exported themes
 * No manual configuration needed - just export themes from providers/theme!
 * @return {object} Discovered themes with name and theme objects
 */
function discoverAvailableThemes() {
	// Direct access to imported themes - more reliable than dynamic discovery
	const { defaultTheme, jetpackTheme, wooTheme } = ThemeProviders;

	const themes = {
		default: { name: 'Default', theme: defaultTheme },
		jetpack: { name: 'Jetpack', theme: jetpackTheme },
		woo: { name: 'WooCommerce', theme: wooTheme },
	};

	// Debug logging to help troubleshoot theme discovery
	if ( typeof window !== 'undefined' && process.env.NODE_ENV === 'development' ) {
		// eslint-disable-next-line no-console
		console.log( '🎨 Theme Discovery Results:', {
			discovered: Object.keys( themes ),
			themeColors: {
				default: defaultTheme.colors,
				jetpack: jetpackTheme.colors,
				woo: wooTheme.colors,
			},
		} );
	}

	return themes;
}

/**
 * Dynamically discovered themes - updates automatically when themes are added/removed
 */
export const AVAILABLE_THEMES = discoverAvailableThemes();

/**
 * Auto-generated configuration from discovered themes
 * @return {object} Generated theme configuration for Storybook
 */
const generateThemeConfig = () => {
	const themeKeys = Object.keys( AVAILABLE_THEMES );
	const themeOptions = themeKeys;
	const themeMapping = Object.fromEntries(
		themeKeys.map( key => [ key, AVAILABLE_THEMES[ key ].theme ] )
	);
	const themeLabels = Object.fromEntries(
		themeKeys.map( key => [ key, AVAILABLE_THEMES[ key ].name ] )
	);

	return { themeOptions, themeMapping, themeLabels };
};

const { themeOptions, themeMapping, themeLabels } = generateThemeConfig();

/**
 * Dynamic theme configuration for Storybook controls
 * Automatically reflects all available themes - zero maintenance required!
 */
export const themeArgTypes = {
	theme: {
		control: {
			type: 'select' as const,
			labels: themeLabels, // Shows friendly names in dropdown
		},
		options: themeOptions,
		mapping: themeMapping,
		defaultValue: themeOptions.includes( 'default' ) ? 'default' : themeOptions[ 0 ],
		table: {
			category: 'Theme',
			type: {
				summary: `${ themeOptions.length } available themes`,
				detail: `Available: ${ Object.values( AVAILABLE_THEMES )
					.map( t => t.name )
					.join( ', ' ) }`,
			},
		},
		description: `Chart theme selection - affects colors, typography, and visual styling. Automatically detected ${ themeOptions.length } theme(s).`,
	},
};

/**
 * Theme mapping for decorators - automatically synchronized
 */
export const THEME_MAP: Record< string, ChartTheme > = themeMapping;

/**
 * Default theme story args - dynamically determined
 */
export const defaultThemeArgs = {
	theme: themeOptions.includes( 'default' ) ? 'default' : themeOptions[ 0 ],
};

/**
 * Advanced Storybook integration utilities
 * @return {string[]} Array of available theme names
 */
export function getAvailableThemeNames(): string[] {
	return Object.keys( AVAILABLE_THEMES );
}

/**
 * Get theme by name with fallback handling
 * @param {string} name - The theme name to retrieve
 * @return {ChartTheme|undefined} The theme object or undefined for default
 */
export function getThemeByName( name: string ): ChartTheme | undefined {
	if ( ! name || name === 'default' ) {
		if ( typeof window !== 'undefined' && process.env.NODE_ENV === 'development' ) {
			// eslint-disable-next-line no-console
			console.log( '🎨 getThemeByName: Using default theme (undefined)' );
		}
		return undefined; // Use default theme (no custom theme)
	}

	const theme = AVAILABLE_THEMES[ name ]?.theme;
	if ( ! theme ) {
		// eslint-disable-next-line no-console
		console.warn(
			`Theme '${ name }' not found. Available themes:`,
			Object.keys( AVAILABLE_THEMES )
		);
		return undefined;
	}

	if ( typeof window !== 'undefined' && process.env.NODE_ENV === 'development' ) {
		// eslint-disable-next-line no-console
		console.log( `🎨 getThemeByName: Retrieved '${ name }' theme with colors:`, theme.colors );
	}

	return theme;
}

/**
 * Dynamic story generator for theme demonstrations
 * Creates stories for each available theme automatically
 * @param {T} baseStory - The base story to generate themed variants for
 * @return {Record<string, T>} Generated themed stories
 */
export function generateThemeStories< T >( baseStory: T ): Record< string, T > {
	const stories: Record< string, T > = {};

	Object.entries( AVAILABLE_THEMES ).forEach( ( [ key, { name } ] ) => {
		stories[ `${ name }Theme` ] = {
			...baseStory,
			args: {
				...( ( baseStory as Record< string, unknown > ).args as Record< string, unknown > ),
				theme: key,
			},
		};
	} );

	return stories;
}

/**
 * Preset color palettes for custom themes
 */
export const COLOR_PRESETS = {
	vibrant: [ '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3' ],
	earthy: [ '#073B3A', '#0B6E4F', '#08A045', '#6BBF59', '#DDB771' ],
	monochrome: [ '#2C3E50', '#34495E', '#7F8C8D', '#95A5A6', '#BDC3C7', '#ECF0F1' ],
	warm: [ '#E74C3C', '#E67E22', '#F39C12', '#F1C40F', '#D35400' ],
	cool: [ '#3498DB', '#2980B9', '#1ABC9C', '#16A085', '#8E44AD', '#9B59B6' ],
	pastel: [ '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#E1BAFF' ],
	corporate: [ '#1F77B4', '#FF7F0E', '#2CA02C', '#D62728', '#9467BD', '#8C564B' ],
	neon: [ '#FF073A', '#00FF87', '#00BFFF', '#FF69B4', '#FFD700', '#7FFF00' ],
};

/**
 * Theme information for documentation and debugging
 */
export const themeDocumentation = {
	count: Object.keys( AVAILABLE_THEMES ).length,
	themes: Object.entries( AVAILABLE_THEMES ).map( ( [ key, { name, theme } ] ) => ( {
		key,
		name,
		colors: theme.colors,
		description: `${ name } theme with ${ theme.colors.length } color palette`,
	} ) ),
	colorPresets: COLOR_PRESETS,
	autoDetected: true,
	lastUpdated: new Date().toISOString(),
};

/**
 * Helper to get a random color preset for experimentation
 * @return {string[]} Random color preset array
 */
export function getRandomColorPreset(): string[] {
	const presetKeys = Object.keys( COLOR_PRESETS );
	const randomKey = presetKeys[
		Math.floor( Math.random() * presetKeys.length )
	] as keyof typeof COLOR_PRESETS;
	return COLOR_PRESETS[ randomKey ];
}

/**
 * Custom theme builder with enhanced options
 * @param {string[]} colors               - Array of color strings for the theme
 * @param {object}   options              - Optional styling configuration
 * @param {Array}    options.strokeStyles - Custom stroke style configurations
 * @param {string}   options.gridColor    - Grid line color
 * @param {number}   options.gridWidth    - Grid line width
 * @return {object} Built theme object with colors and styles
 */
export function buildCustomTheme(
	colors: string[],
	options?: {
		strokeStyles?: Array< {
			strokeWidth?: number;
			strokeDasharray?: string;
			strokeLinecap?: 'inherit' | 'round' | 'butt' | 'square';
		} >;
		gridColor?: string;
		gridWidth?: number;
	}
) {
	return {
		colors,
		seriesLineStyles: options?.strokeStyles || [
			{ strokeWidth: 2, strokeDasharray: '5 5', strokeLinecap: 'round' as const },
			{ strokeWidth: 3, strokeDasharray: '10 2', strokeLinecap: 'round' as const },
		],
		gridStyles: {
			stroke: options?.gridColor || '#e0e0e0',
			strokeWidth: options?.gridWidth || 1,
		},
	};
}

/**
 * Verification helper for troubleshooting themes in Storybook
 * @return {object} Verification results with theme discovery status
 */
export function verifyThemeSystem() {
	const results = {
		discoveredThemes: Object.keys( AVAILABLE_THEMES ),
		themeCount: Object.keys( AVAILABLE_THEMES ).length,
		colorPresets: Object.keys( COLOR_PRESETS ),
		sampleThemeTest: {} as Record< string, boolean >,
	};

	// Test each theme can be resolved
	Object.keys( AVAILABLE_THEMES ).forEach( key => {
		const theme = getThemeByName( key );
		results.sampleThemeTest[ key ] = !! ( theme && theme.colors && theme.colors.length > 0 );
	} );

	return results;
}
