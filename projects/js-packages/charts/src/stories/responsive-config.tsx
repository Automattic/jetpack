/**
 * Shared responsive configuration for chart stories
 * Provides consistent responsive controls across all chart story files
 */
export const responsiveArgTypes = {
	maxWidth: {
		control: {
			type: 'number' as const,
			min: 100,
			max: 1200,
		},
		table: { category: 'Layout' },
		description: 'Maximum width of the chart container',
	},
	aspectRatio: {
		control: {
			type: 'number' as const,
			min: 0,
			max: 1,
			step: 0.1,
		},
		table: { category: 'Layout' },
		description: 'Height to width ratio (0-1)',
	},
	resizeDebounceTime: {
		control: {
			type: 'number' as const,
			min: 0,
			max: 10000,
			step: 100,
		},
		table: { category: 'Performance' },
		description: 'Debounce time for resize events in milliseconds',
	},
};

/**
 * Default responsive story args
 */
export const defaultResponsiveArgs = {
	maxWidth: 1200,
	aspectRatio: 0.5,
	resizeDebounceTime: 300,
};
