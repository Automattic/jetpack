import { PieChartTooltip } from '../pie-chart-tooltip';
import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';

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
 * Helper wrapper for tooltip stories with consistent background.
 */
const TooltipWrapper = ( { children }: { children: ReactNode } ) => (
	<div
		style={ {
			background: 'var(--wpds-color-background-surface-neutral)',
			padding: '20px',
			borderRadius: '8px',
		} }
	>
		{ children }
	</div>
);

/**
 * NumberFormat: Pie tooltip with number formatting.
 */
export const NumberFormat: Story = {
	render: () => (
		<TooltipWrapper>
			<PieChartTooltip
				tooltipData={ {
					label: 'Completed',
					value: 45,
					color: '#3858E9',
				} }
				dataFormat={ { type: 'number' } }
			/>
		</TooltipWrapper>
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
		<TooltipWrapper>
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
		</TooltipWrapper>
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
		<TooltipWrapper>
			<PieChartTooltip
				tooltipData={ {
					label: 'Conversion Rate',
					value: 0.0325,
					color: '#66BDFF',
				} }
				dataFormat={ { type: 'percentage' } }
			/>
		</TooltipWrapper>
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
		<TooltipWrapper>
			<PieChartTooltip
				tooltipData={ {
					label: 'Cancelled',
					value: 15,
					color: '#FF5630',
				} }
				dataFormat={ { type: 'number' } }
			/>
		</TooltipWrapper>
	),
	parameters: {
		docs: {
			description: {
				story: 'Pie chart tooltip showing a custom red color indicator.',
			},
		},
	},
};
