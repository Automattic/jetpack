import { GlobalChartsProvider } from '../../../providers';
import { TooltipBox } from '../index';
import type { Meta, StoryObj } from '@storybook/react';

type Story = StoryObj< typeof TooltipBox >;

const meta = {
	title: 'JS Packages/Charts Library/Components/TooltipBox',
	component: TooltipBox,
	parameters: {
		layout: 'centered',
		docs: {
			description: {
				component:
					'The chart tooltip box: the dark surface every chart tooltip draws. It does not position itself, so place it with `style` or a wrapper. Use it to draw a tooltip outside a visx `XYChart`; inside one, use `XYChartTooltip`. Set `unstyled` to drop the surface.',
			},
		},
	},
	decorators: [
		Story => (
			<GlobalChartsProvider>
				<Story />
			</GlobalChartsProvider>
		),
	],
	args: {
		children: 'Monthly Sales: 4,200',
	},
} satisfies Meta< typeof TooltipBox >;

export default meta;

export const Default: Story = {};

export const Positioned: Story = {
	render: args => (
		<div
			style={ {
				position: 'relative',
				width: 300,
				height: 200,
				border: '1px dashed #999',
			} }
		>
			<TooltipBox { ...args } style={ { position: 'absolute', left: 100, top: 60 } } />
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: 'The box sets no position, so the caller places it with `style`.',
			},
		},
	},
};

export const Unstyled: Story = {
	args: {
		unstyled: true,
		style: {
			padding: '12px',
			background: '#fff',
			color: '#1e1e1e',
			border: '1px solid #ddd',
			borderRadius: '8px',
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					'`unstyled` drops the surface, so the caller draws the whole box. Here it draws a light card.',
			},
		},
	},
};
