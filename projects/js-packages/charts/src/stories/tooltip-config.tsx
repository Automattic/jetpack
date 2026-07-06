/**
 * Shared tooltip configuration for chart stories
 * Provides consistent argTypes across all chart tooltip stories
 */
export const tooltipArgTypes = {
	withTooltips: {
		control: { type: 'boolean' as const },
		description: 'Enable or disable interactive tooltips on hover',
		table: { category: 'Tooltips' },
	},
	renderTooltip: {
		control: false as const,
		description: 'Custom render function for tooltip content',
		table: { disable: true }, // Hide from Storybook - function props aren't useful to show
	},
};

/**
 * Flat, story-only tooltip controls (not component props). Include in a story's
 * `StoryArgs` type so Storybook v10's typed `Meta`/`ArgTypes` accept the flat keys.
 * `withTooltips`, `renderTooltip`, and `withTooltipCrosshairs` are real component props,
 * so they are intentionally excluded here.
 */
export type TooltipStoryControls = {
	crosshairMode?: 'none' | 'vertical' | 'horizontal' | 'both';
};

/**
 * Additional tooltip argTypes for line charts with crosshair support
 */
export const lineChartTooltipArgTypes = {
	...tooltipArgTypes,
	crosshairMode: {
		control: { type: 'select' as const },
		options: [ 'none', 'vertical', 'horizontal', 'both' ],
		description: 'Show crosshair lines on tooltip hover',
		table: { category: 'Tooltips' },
	},
	withTooltipCrosshairs: {
		control: false as const,
		table: { disable: true }, // Hidden - use crosshairMode instead
	},
};
