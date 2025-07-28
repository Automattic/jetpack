import { jetpackTheme, wooTheme } from '../providers/theme';

/**
 * Shared legend configuration for chart stories
 * Provides consistent argTypes and decorators across all chart legend stories
 */
export const legendArgTypes = {
	showLegend: {
		control: 'boolean',
		table: { category: 'Legend' },
	},
	legendAlignmentHorizontal: {
		control: 'select',
		options: [ 'left', 'center', 'right' ],
		table: { category: 'Legend' },
	},
	legendAlignmentVertical: {
		control: 'select',
		options: [ 'top', 'bottom' ],
		table: { category: 'Legend' },
	},
	legendOrientation: {
		control: 'select',
		options: [ 'horizontal', 'vertical' ],
		table: { category: 'Legend' },
	},
	legendShape: {
		control: 'select',
		options: [ 'circle', 'rect' ],
		table: { category: 'Legend' },
	},
	withLegendGlyph: {
		control: 'boolean',
		table: { category: 'Legend' },
		description: 'Show glyphs in legend (Line charts only)',
	},
	theme: {
		control: 'select',
		options: {
			default: undefined,
			jetpack: jetpackTheme,
			woo: wooTheme,
		},
		defaultValue: undefined,
		table: { category: 'Theme' },
	},
};
