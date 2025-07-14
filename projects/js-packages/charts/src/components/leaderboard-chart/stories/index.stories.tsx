import { LeaderboardChart } from '../leaderboard-chart';
import { sampleData, smallDataset, largeValues, negativeGrowth } from './sample-data';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof LeaderboardChart > = {
	title: 'Charts/LeaderboardChart',
	component: LeaderboardChart,
	parameters: {
		layout: 'centered',
		docs: {
			description: {
				component:
					'A leaderboard chart component that displays ranked data with progress bars and optional comparison values.',
			},
		},
	},
	tags: [ 'autodocs' ],
	argTypes: {
		loading: {
			control: 'boolean',
			description: 'Whether the chart is in loading state',
		},
		withComparison: {
			control: 'boolean',
			description: 'Whether to show comparison data',
		},
		primaryColor: {
			control: 'color',
			description: 'Primary color for current period bars',
		},
		secondaryColor: {
			control: 'color',
			description: 'Secondary color for comparison period bars',
		},
	},
	decorators: [
		Story => (
			<div style={ { width: '400px', padding: '20px' } }>
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj< typeof meta >;

export const Default: Story = {
	args: {
		data: sampleData,
		withComparison: true,
		loading: false,
		primaryColor: '#3858E9',
		secondaryColor: '#66BDFF',
	},
};

export const WithoutComparison: Story = {
	args: {
		data: sampleData,
		withComparison: false,
		loading: false,
		primaryColor: '#3858E9',
		secondaryColor: '#66BDFF',
	},
};

export const Loading: Story = {
	args: {
		data: sampleData,
		withComparison: true,
		loading: true,
		primaryColor: '#3858E9',
		secondaryColor: '#66BDFF',
	},
};

export const CustomColors: Story = {
	args: {
		data: sampleData,
		withComparison: true,
		loading: false,
		primaryColor: '#FF6B6B',
		secondaryColor: '#4ECDC4',
	},
};

export const SmallDataset: Story = {
	args: {
		data: smallDataset,
		withComparison: true,
		loading: false,
		primaryColor: '#3858E9',
		secondaryColor: '#66BDFF',
	},
};

export const EmptyData: Story = {
	args: {
		data: [],
		withComparison: true,
		loading: false,
		primaryColor: '#3858E9',
		secondaryColor: '#66BDFF',
	},
};

export const LargeValues: Story = {
	args: {
		data: largeValues,
		withComparison: true,
		loading: false,
		primaryColor: '#3858E9',
		secondaryColor: '#66BDFF',
	},
};

export const NegativeGrowth: Story = {
	args: {
		data: negativeGrowth,
		withComparison: true,
		loading: false,
		primaryColor: '#3858E9',
		secondaryColor: '#66BDFF',
	},
};
