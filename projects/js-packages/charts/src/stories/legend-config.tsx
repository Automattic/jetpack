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
	legendValueDisplay: {
		control: { type: 'select' as const },
		options: [ 'percentage', 'value', 'valueDisplay', 'none' ],
		table: { category: 'Legend' },
		description:
			'What type of value to display in the legend when showValues is true. Note: Enable "showLegend" to see the effect of this control.',
	},
	legendMaxWidth: {
		control: { type: 'text' as const },
		table: { category: 'Legend' },
		description:
			'Maximum width for legend items as CSS value (e.g. "200px", "50%", "10rem"). When set, text overflow behavior is controlled by legendTextOverflow.',
	},
	legendTextOverflow: {
		control: { type: 'select' as const },
		options: [ 'wrap', 'ellipsis' ],
		table: { category: 'Legend' },
		description:
			'Controls how text behaves when it exceeds legendMaxWidth. "ellipsis" truncates with ... (ideal for widgets), "wrap" allows text to wrap to multiple lines.',
	},
	legendItemClassName: {
		control: { type: 'text' as const },
		table: { category: 'Legend' },
		description:
			'Additional CSS class name for legend items. This allows consumers to customize individual legend item styling.',
	},
};
