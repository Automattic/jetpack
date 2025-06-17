import React from 'react';
import { ThemeProvider, jetpackTheme, wooTheme } from '../../../providers/theme';
import { PieChart } from '../../pie-chart';
import type { Meta, StoryFn, StoryObj } from '@storybook/react';

const data = [
	{
		label: 'Desktop',
		value: 45000,
		valueDisplay: '45K',
		percentage: 45,
	},
	{
		label: 'Mobile',
		value: 35000,
		valueDisplay: '35K',
		percentage: 35,
	},
	{
		label: 'Tablet',
		value: 20000,
		valueDisplay: '20K',
		percentage: 20,
	},
];

const meta: Meta< typeof PieChart > = {
	title: 'JS Packages/Charts/Types/Pie Chart/Legend',
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
		theme: {
			control: 'select',
			options: {
				default: undefined,
				jetpack: jetpackTheme,
				woo: wooTheme,
			},
			defaultValue: undefined,
		},
		legendAlign: {
			control: 'select',
			options: [ 'left', 'center', 'right' ],
		},
		legendVerticalAlign: {
			control: 'select',
			options: [ 'top', 'bottom' ],
		},
	},
} satisfies Meta< typeof PieChart >;

export default meta;

const Template: StoryFn< typeof PieChart > = args => <PieChart { ...args } />;

const legendStoryArgs = {
	data,
	width: 600,
	height: 600,
	thickness: 0, // Full pie (not donut)
	innerRadius: 0, // Explicitly set inner radius for full pie
	gapScale: 0.03,
	padding: 20,
	cornerScale: 0.03,
	withTooltips: true,
	showLegend: true,
	legendOrientation: 'horizontal' as const,
};

export const Default: StoryObj< typeof PieChart > = Template.bind( {} );
Default.args = {
	...legendStoryArgs,
};

export const TopRight: StoryObj< typeof PieChart > = Template.bind( {} );
TopRight.args = {
	...legendStoryArgs,
	legendAlign: 'right',
	legendVerticalAlign: 'top',
};

export const TopLeft: StoryObj< typeof PieChart > = Template.bind( {} );
TopLeft.args = {
	...legendStoryArgs,
	legendAlign: 'left',
	legendVerticalAlign: 'top',
};

export const TopCenter: StoryObj< typeof PieChart > = Template.bind( {} );
TopCenter.args = {
	...legendStoryArgs,
	legendAlign: 'center',
	legendVerticalAlign: 'top',
};

export const BottomLeft: StoryObj< typeof PieChart > = Template.bind( {} );
BottomLeft.args = {
	...legendStoryArgs,
	legendAlign: 'left',
	legendVerticalAlign: 'bottom',
};

export const BottomCenter: StoryObj< typeof PieChart > = Template.bind( {} );
BottomCenter.args = {
	...legendStoryArgs,
	legendAlign: 'center',
	legendVerticalAlign: 'bottom',
};

export const BottomRight: StoryObj< typeof PieChart > = Template.bind( {} );
BottomRight.args = {
	...legendStoryArgs,
	legendAlign: 'right',
	legendVerticalAlign: 'bottom',
};

export const VerticalOrientation: StoryObj< typeof PieChart > = Template.bind( {} );
VerticalOrientation.args = {
	...legendStoryArgs,
	legendOrientation: 'vertical',
	legendAlign: 'right',
	legendVerticalAlign: 'top',
};
