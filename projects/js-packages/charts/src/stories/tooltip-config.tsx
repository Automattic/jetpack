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
		control: false,
		description: 'Custom render function for tooltip content',
		table: { category: 'Tooltips' },
	},
};

/**
 * Additional tooltip argTypes for line charts with crosshair support
 */
export const lineChartTooltipArgTypes = {
	...tooltipArgTypes,
	withTooltipCrosshairs: {
		control: false,
		description: 'Configuration for tooltip crosshairs (vertical/horizontal lines)',
		table: { category: 'Tooltips' },
	},
};
