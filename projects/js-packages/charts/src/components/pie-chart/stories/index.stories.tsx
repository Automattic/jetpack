import { ThemeProvider, jetpackTheme, wooTheme } from '../../../providers/theme';
import { PieChart } from '../index';
import type { Meta, StoryObj } from '@storybook/react';

const data = [
	{
		label: 'MacOS',
		value: 30000,
		valueDisplay: '30K',
		percentage: 23,
	},
	{
		label: 'Linux',
		value: 22000,
		valueDisplay: '22K',
		percentage: 17,
	},
	{
		label: 'Windows',
		value: 80000,
		valueDisplay: '80K',
		percentage: 60,
	},
];

const meta = {
	title: 'JS Packages/Charts/Types/Pie Chart',
	component: PieChart,
	parameters: {
		layout: 'centered',
	},
	decorators: [
		( Story, { args } ) => (
			<ThemeProvider theme={ args.theme }>
				<div
					style={ {
						resize: 'both',
						overflow: 'auto',
						padding: '2rem',
						width: '800px',
						aspectRatio: '1/1',
						minWidth: '400px',
						maxWidth: '1200px',
						height: '800px',
						border: '1px dashed #ccc',
					} }
				>
					<Story />
				</div>
			</ThemeProvider>
		),
	],
	argTypes: {
		size: {
			control: {
				type: 'range',
				min: 100,
				max: 800,
				step: 10,
				default: 400,
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
		theme: {
			control: 'select',
			options: {
				default: undefined,
				jetpack: jetpackTheme,
				woo: wooTheme,
			},
			defaultValue: undefined,
		},
	},
} satisfies Meta< typeof PieChart >;

export default meta;
type Story = StoryObj< typeof PieChart >;

export const Default: Story = {
	args: {
		size: 600,
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

export const WithHorizontalLegend: Story = {
	args: {
		...Default.args,
		showLegend: true,
		size: 600,
		legendOrientation: 'horizontal',
	},
};

export const WithVerticalLegend: Story = {
	args: {
		...Default.args,
		showLegend: true,
		size: 600,
		legendOrientation: 'vertical',
	},
};

export const Doughnut: Story = {
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

export const WithTooltips: Story = {
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

export const WithTooltipsDoughnut: Story = {
	args: {
		...Default.args,
		thickness: 0.5,
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

const responsiveArgs = { ...Default.args };
delete responsiveArgs.size;
export const Responsiveness: Story = {
	args: responsiveArgs,
	parameters: {
		docs: {
			description: {
				story: 'Pie chart with responsive behavior. Uses size prop instead of width/height.',
			},
		},
	},
};

export const ErrorStates: Story = {
	render: () => (
		<div style={ { display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(2, 1fr)' } }>
			<div>
				<h3>Empty Data</h3>
				<PieChart size={ 300 } data={ [] } />
			</div>
			<div>
				<h3>Invalid Percentage Total</h3>
				<PieChart
					size={ 300 }
					data={ [
						{ label: 'A', value: 30, percentage: 30 },
						{ label: 'B', value: 40, percentage: 40 },
					] } // Only adds up to 70%
				/>
			</div>
			<div>
				<h3>Negative Values</h3>
				<PieChart
					size={ 300 }
					data={ [
						{ label: 'A', value: -30, percentage: -30 },
						{ label: 'B', value: 130, percentage: 130 },
					] }
				/>
			</div>
			<div>
				<h3>Single Data Point</h3>
				<PieChart size={ 300 } data={ [ { label: 'A', value: 100, percentage: 100 } ] } />
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: 'Examples of how the pie chart handles various error states and edge cases.',
			},
		},
	},
};
