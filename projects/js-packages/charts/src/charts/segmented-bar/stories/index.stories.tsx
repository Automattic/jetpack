import { SegmentedBar } from '../';
import type { SegmentedBarProps } from '../types';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< SegmentedBarProps > = {
	title: 'JS Packages/Charts Library/Charts/Segmented Bar',
	component: SegmentedBar,
	parameters: {
		layout: 'padded',
	},
	argTypes: {
		values: {
			control: 'object',
			description: 'Array of segment values (numbers or segment objects with value, label, color)',
			table: { category: 'Data' },
		},
		mode: {
			control: 'select',
			options: [ 'proportional', 'equal' ],
			description: 'Proportional: widths based on values. Equal: all segments same width.',
			table: { category: 'Display' },
		},
		colors: {
			control: 'object',
			description: 'Custom colors for segments',
			table: { category: 'Visual Style' },
		},
		showLabels: {
			control: 'boolean',
			description: 'Show cumulative value labels',
			table: { category: 'Display' },
		},
		withTooltips: {
			control: 'boolean',
			description: 'Show tooltips on hover',
			table: { category: 'Interaction' },
		},
		height: {
			control: { type: 'number', min: 4, max: 32 },
			description: 'Height of the bar in pixels',
			table: { category: 'Dimensions' },
		},
		gap: {
			control: { type: 'number', min: 0, max: 8 },
			description: 'Gap between segments in pixels',
			table: { category: 'Visual Style' },
		},
		borderRadius: {
			control: { type: 'number', min: 0, max: 16 },
			description: 'Corner radius for the bar',
			table: { category: 'Visual Style' },
		},
	},
};

export default meta;
type Story = StoryObj< typeof SegmentedBar >;

/**
 * Default segmented bar with proportional segments.
 * Use the controls to explore different configurations.
 */
export const Default: Story = {
	args: {
		values: [
			{ value: 40, label: 'Direct' },
			{ value: 30, label: 'Organic Search' },
			{ value: 20, label: 'Referral' },
			{ value: 10, label: 'Social' },
		],
		height: 8,
		withTooltips: true,
	},
};

/**
 * Equal mode where all segments have the same width regardless of values.
 * Useful for status indicators like health checks.
 */
export const EqualMode: Story = {
	args: {
		values: [
			{ value: 1, label: 'Critical' },
			{ value: 1, label: 'Warning' },
			{ value: 1, label: 'Good' },
		],
		mode: 'equal',
		height: 6,
		colors: [ '#ef4444', '#f59e0b', '#22c55e' ],
		gap: 2,
		borderRadius: 3,
		showLabels: false,
	},
};

/**
 * Segmented bar with a marker indicating a specific position.
 */
export const WithMarker: Story = {
	args: {
		values: [ 25, 35, 25, 15 ],
		height: 8,
		marker: {
			value: 60,
			tooltip: 'Target: 60%',
			showAnimation: true,
		},
		withTooltips: true,
	},
};
