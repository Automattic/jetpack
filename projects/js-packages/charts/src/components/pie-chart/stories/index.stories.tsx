import { ThemeProvider, jetpackTheme, wooTheme } from '../../../providers/theme';
import { PieChart } from '../index';
import type { Meta, StoryObj } from '@storybook/react';

const data = [
	{ label: 'A', value: 30 },
	{ label: 'B', value: 20 },
	{ label: 'C', value: 15 },
	{ label: 'D', value: 35 },
];

type StoryType = StoryObj< typeof PieChart >;

export default {
	title: 'JS Packages/Charts/Types/Pie Chart',
	component: PieChart,
	parameters: {
		layout: 'centered',
	},
	argTypes: {
		theme: {
			control: 'select',
			options: {
				default: undefined,
				jetpack: jetpackTheme,
				woo: wooTheme,
			},
			defaultValue: undefined,
		},
		size: {
			control: {
				type: 'range',
				min: 100,
				max: 800,
				step: 1,
			},
		},
		thickness: {
			control: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
		padding: {
			control: {
				type: 'range',
				min: 0,
				max: 100,
				step: 1,
			},
		},
		gapScale: {
			control: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
		cornerScale: {
			control: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
		legendOrientation: {
			control: 'radio',
			options: [ 'horizontal', 'vertical' ],
		},
	},
	decorators: [
		( Story, { args } ) => (
			<ThemeProvider theme={ args.theme }>
				<div style={ { padding: '2rem' } }>
					<Story />
				</div>
			</ThemeProvider>
		),
	],
} satisfies Meta< typeof PieChart >;

export const Default: StoryType = {
	args: {
		size: 400,
		thickness: 1,
		gapScale: 0,
		padding: 20,
		cornerScale: 0,
		withTooltips: false,
		data,
		theme: 'default',
		showLegend: false,
		legendOrientation: 'horizontal',
	},
};

export const WithHorizontalLegend: StoryType = {
	args: {
		...Default.args,
		showLegend: true,
		legendOrientation: 'horizontal',
	},
};

export const WithVerticalLegend: StoryType = {
	args: {
		...Default.args,
		showLegend: true,
		legendOrientation: 'vertical',
	},
};

export const Doughnut: StoryType = {
	args: {
		...Default.args,
		thickness: 0.5,
	},
	parameters: {
		docs: {
			description: {
				story: 'Doughnut chart variant with the thickness set to 0.5 (50%).',
			},
		},
	},
};

export const WithTooltips: StoryType = {
	args: {
		...Default.args,
		withTooltips: true,
	},
	parameters: {
		docs: {
			description: {
				story: 'Pie chart with interactive tooltips that appear on hover.',
			},
		},
	},
};

export const WithTooltipsDoughnut: StoryType = {
	args: {
		...Default.args,
		withTooltips: true,
	},
	parameters: {
		docs: {
			description: {
				story: 'Doughnut chart with interactive tooltips that appear on hover.',
			},
		},
	},
};
