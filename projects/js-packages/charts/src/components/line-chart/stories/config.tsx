import React from 'react';
import LineChart from '../line-chart';
import sampleData from './sample-data';
import type { Meta } from '@storybook/react';

export const lineChartMetaArgs = {
	title: 'JS Packages/Charts/Types/Line Chart',
	component: LineChart,
	parameters: {
		layout: 'centered',
	},
	decorators: [
		Story => (
			<div
				style={ {
					resize: 'both',
					overflow: 'auto',
					padding: '2rem',
					width: '800px',
					maxWidth: '1200px',
					border: '1px dashed #ccc',
					display: 'inline-block',
				} }
			>
				<Story />
			</div>
		),
	],
	argTypes: {
		maxWidth: {
			control: {
				type: 'number',
				min: 100,
				max: 1200,
			},
		},
		aspectRatio: {
			control: {
				type: 'number',
				min: 0,
				max: 1,
			},
		},
		resizeDebounceTime: {
			control: {
				type: 'number',
				min: 0,
				max: 10000,
			},
		},
	},
} satisfies Meta< typeof LineChart >;

export const lineChartStoryArgs = {
	data: sampleData,
	showLegend: false,
	legendOrientation: 'horizontal',
	withGradientFill: false,
	smoothing: true,
	maxWidth: 1200,
	aspectRatio: 0.5,
	resizeDebounceTime: 300,
	options: {
		axis: {
			x: {
				orientation: 'bottom',
			},
			y: {
				orientation: 'left',
			},
		},
	},
	withTooltips: true,
};
