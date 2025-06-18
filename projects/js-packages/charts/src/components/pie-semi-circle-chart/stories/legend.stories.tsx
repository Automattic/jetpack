import React from 'react';
import { ThemeProvider, jetpackTheme, wooTheme } from '../../../providers/theme';
import { PieSemiCircleChart } from '../../pie-semi-circle-chart';
import type { Meta, StoryFn, StoryObj } from '@storybook/react';

const data = [
	{
		label: 'MacOS',
		value: 30000,
		valueDisplay: '30K',
		percentage: 30,
	},
	{
		label: 'Linux',
		value: 22000,
		valueDisplay: '22K',
		percentage: 22,
	},
	{
		label: 'Windows',
		value: 48000,
		valueDisplay: '48K',
		percentage: 48,
	},
];

const meta: Meta< typeof PieSemiCircleChart > = {
	title: 'JS Packages/Charts/Types/Pie Semi Circle Chart/Legend',
	component: PieSemiCircleChart,
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
			options: [ 'left', 'center', 'right' ],
		},
		legendVerticalAlign: {
			control: 'select',
			options: [ 'top', 'bottom' ],
		},
	},
} satisfies Meta< typeof PieSemiCircleChart >;

export default meta;

const Template: StoryFn< typeof PieSemiCircleChart > = args => <PieSemiCircleChart { ...args } />;

const legendStoryArgs = {
	data,
	width: 600,
	thickness: 0.4,
	withTooltips: true,
	showLegend: true,
	legendOrientation: 'horizontal' as const,
	label: 'OS',
	note: 'Windows +10%',
};

export const Default: StoryObj< typeof PieSemiCircleChart > = Template.bind( {} );
Default.args = {
	...legendStoryArgs,
};

export const AlignmentPositioning: StoryObj< typeof PieSemiCircleChart > = Template.bind( {} );
AlignmentPositioning.args = {
	...legendStoryArgs,
	legendAlign: 'right',
	legendVerticalAlign: 'top',
};

export const VerticalOrientation: StoryObj< typeof PieSemiCircleChart > = Template.bind( {} );
VerticalOrientation.args = {
	...legendStoryArgs,
	legendOrientation: 'vertical',
	legendAlign: 'right',
	legendVerticalAlign: 'top',
};
