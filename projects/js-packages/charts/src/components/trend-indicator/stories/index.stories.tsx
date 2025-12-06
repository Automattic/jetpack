import { Meta, StoryObj } from '@storybook/react';
import { TrendIndicator } from '../trend-indicator';
import type { TrendIndicatorProps } from '../types';

const meta: Meta< TrendIndicatorProps > = {
	title: 'JS Packages/Charts/Components/Trend Indicator',
	component: TrendIndicator,
	parameters: {
		layout: 'centered',
	},
};

export default meta;
type Story = StoryObj< TrendIndicatorProps >;

export const Up: Story = {
	args: {
		direction: 'up',
		value: '+14%',
	},
};

export const Down: Story = {
	args: {
		direction: 'down',
		value: '-5%',
	},
};

export const Neutral: Story = {
	args: {
		direction: 'neutral',
		value: '0%',
	},
};
