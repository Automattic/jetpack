import { TooltipBox } from '@jetpack-premium-analytics/externals';
import { PieChartTooltip } from '../pie-chart-tooltip';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof PieChartTooltip > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/PieChartTooltip',
	component: PieChartTooltip,
	tags: [ 'autodocs' ],
	parameters: {
		layout: 'centered',
	},
};

export default meta;
type Story = StoryObj< typeof PieChartTooltip >;

/**
 * NumberFormat: Pie tooltip with number formatting.
 */
export const NumberFormat: Story = {
	render: () => (
		<TooltipBox>
			<PieChartTooltip
				tooltipData={ {
					label: 'Completed',
					value: 45,
					color: '#3858E9',
				} }
				dataFormat={ { type: 'number' } }
			/>
		</TooltipBox>
	),
	parameters: {
		docs: {
			description: {
				story:
					'Pie chart tooltip with number formatting. Shows color indicator, label, and formatted value.',
			},
		},
	},
};

/**
 * CurrencyFormat: Pie tooltip with currency formatting.
 */
export const CurrencyFormat: Story = {
	render: () => (
		<TooltipBox>
			<PieChartTooltip
				tooltipData={ {
					label: 'Online Sales',
					value: 45000,
					color: '#3858E9',
				} }
				dataFormat={ {
					type: 'currency',
					options: { useMultipliers: true, decimals: 0 },
				} }
			/>
		</TooltipBox>
	),
	parameters: {
		docs: {
			description: {
				story: 'Pie chart tooltip with currency formatting.',
			},
		},
	},
};

/**
 * PercentageFormat: Pie tooltip with percentage formatting.
 */
export const PercentageFormat: Story = {
	render: () => (
		<TooltipBox>
			<PieChartTooltip
				tooltipData={ {
					label: 'Conversion Rate',
					value: 0.0325,
					color: '#66BDFF',
				} }
				dataFormat={ { type: 'percentage' } }
			/>
		</TooltipBox>
	),
	parameters: {
		docs: {
			description: {
				story: 'Pie chart tooltip with percentage formatting.',
			},
		},
	},
};

/**
 * CustomColor: Pie tooltip with a custom segment color.
 */
export const CustomColor: Story = {
	render: () => (
		<TooltipBox>
			<PieChartTooltip
				tooltipData={ {
					label: 'Cancelled',
					value: 15,
					color: '#FF5630',
				} }
				dataFormat={ { type: 'number' } }
			/>
		</TooltipBox>
	),
	parameters: {
		docs: {
			description: {
				story: 'Pie chart tooltip showing a custom red color indicator.',
			},
		},
	},
};
