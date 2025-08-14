import { jetpackTheme, wooTheme } from '../providers/theme';

/**
 * Shared legend configuration for chart stories
 * Provides consistent argTypes and decorators across all chart legend stories
 */
export const legendArgTypes = {
	showLegend: {
		control: { type: 'boolean' as const },
		table: { category: 'Legend' },
	},
	legendPosition: {
		control: { type: 'select' as const },
		options: [ 'top', 'bottom' ],
		table: { category: 'Legend' },
	},
	legendAlignment: {
		control: { type: 'select' as const },
		options: [ 'start', 'center', 'end' ],
		table: { category: 'Legend' },
	},
	legendOrientation: {
		control: { type: 'select' as const },
		options: [ 'horizontal', 'vertical' ],
		table: { category: 'Legend' },
	},
	legendShape: {
		control: { type: 'select' as const },
		options: [ 'circle', 'rect' ],
		table: { category: 'Legend' },
	},
	withLegendGlyph: {
		control: { type: 'boolean' as const },
		table: { category: 'Legend' },
		description: 'Show glyphs in legend (Line charts only)',
	},
	theme: {
		control: { type: 'select' as const },
		options: {
			default: undefined,
			jetpack: jetpackTheme,
			woo: wooTheme,
		},
		defaultValue: undefined,
		table: { category: 'Theme' },
	},
};
