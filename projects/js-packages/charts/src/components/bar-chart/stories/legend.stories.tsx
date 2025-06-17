import React from 'react';
import { ThemeProvider, jetpackTheme, wooTheme } from '../../../providers/theme';
import { BarChart } from '../../bar-chart';
import type { Meta, StoryFn, StoryObj } from '@storybook/react';

const data = [
	{
		label: 'Q1 2023',
		data: [
			{ date: new Date( '2023-01-01' ), value: 100 },
			{ date: new Date( '2023-02-01' ), value: 120 },
			{ date: new Date( '2023-03-01' ), value: 110 },
		],
	},
	{
		label: 'Q2 2023',
		data: [
			{ date: new Date( '2023-01-01' ), value: 90 },
			{ date: new Date( '2023-02-01' ), value: 105 },
			{ date: new Date( '2023-03-01' ), value: 125 },
		],
	},
	{
		label: 'Q3 2023',
		data: [
			{ date: new Date( '2023-01-01' ), value: 85 },
			{ date: new Date( '2023-02-01' ), value: 95 },
			{ date: new Date( '2023-03-01' ), value: 115 },
		],
	},
];

const meta: Meta< typeof BarChart > = {
	title: 'JS Packages/Charts/Types/Bar Chart/Legend',
	component: BarChart,
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
						height: '600px',
						minWidth: '400px',
						maxWidth: '1200px',
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
			options: ['left', 'center', 'right'],
		},
		legendVerticalAlign: {
			control: 'select',
			options: ['top', 'bottom'],
		},
	},
} satisfies Meta< typeof BarChart >;

export default meta;

const Template: StoryFn< typeof BarChart > = args => <BarChart { ...args } />;

const legendStoryArgs = {
	data,
	height: 400,
	showLegend: true,
	legendOrientation: 'horizontal' as const,
	withTooltips: true,
};

export const Default: StoryObj< typeof BarChart > = Template.bind( {} );
Default.args = {
	...legendStoryArgs,
};

export const TopRight: StoryObj< typeof BarChart > = Template.bind( {} );
TopRight.args = {
	...legendStoryArgs,
	legendAlign: 'right',
	legendVerticalAlign: 'top',
};

export const TopLeft: StoryObj< typeof BarChart > = Template.bind( {} );
TopLeft.args = {
	...legendStoryArgs,
	legendAlign: 'left',
	legendVerticalAlign: 'top',
};

export const TopCenter: StoryObj< typeof BarChart > = Template.bind( {} );
TopCenter.args = {
	...legendStoryArgs,
	legendAlign: 'center',
	legendVerticalAlign: 'top',
};

export const BottomLeft: StoryObj< typeof BarChart > = Template.bind( {} );
BottomLeft.args = {
	...legendStoryArgs,
	legendAlign: 'left',
	legendVerticalAlign: 'bottom',
};

export const BottomCenter: StoryObj< typeof BarChart > = Template.bind( {} );
BottomCenter.args = {
	...legendStoryArgs,
	legendAlign: 'center',
	legendVerticalAlign: 'bottom',
};

export const BottomRight: StoryObj< typeof BarChart > = Template.bind( {} );
BottomRight.args = {
	...legendStoryArgs,
	legendAlign: 'right',
	legendVerticalAlign: 'bottom',
};

export const VerticalOrientation: StoryObj< typeof BarChart > = Template.bind( {} );
VerticalOrientation.args = {
	...legendStoryArgs,
	legendOrientation: 'vertical',
	legendAlign: 'right',
	legendVerticalAlign: 'top',
};

export const HorizontalBars: StoryObj< typeof BarChart > = Template.bind( {} );
HorizontalBars.args = {
	...legendStoryArgs,
	orientation: 'horizontal',
	legendAlign: 'right',
	legendVerticalAlign: 'top',
};