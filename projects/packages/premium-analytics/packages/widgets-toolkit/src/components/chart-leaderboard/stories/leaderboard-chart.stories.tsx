import { withChartTheme } from '../../../stories/with-chart-theme';
import { LeaderboardChart } from '../leaderboard-chart';
import type { LeaderboardChartData } from '../leaderboard-chart';
import type { Meta, StoryObj, Decorator } from '@storybook/react';

const meta: Meta< typeof LeaderboardChart > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/LeaderboardChart',
	component: LeaderboardChart,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'Generic LeaderboardChart component for displaying ranking/leaderboard data. Used for "top X by Y" type visualizations (e.g., sales by source, by channel, by campaign).',
			},
		},
	},
	decorators: [ withChartTheme ],
};

export default meta;

type Story = StoryObj< typeof LeaderboardChart >;

// Mock data for stories
const mockLeaderboardData: LeaderboardChartData = [
	{
		id: '1',
		label: 'Direct traffic',
		currentValue: 125000,
		previousValue: 98000,
		currentShare: 42,
		previousShare: 35,
		delta: 27.55,
	},
	{
		id: '2',
		label: 'Google Ads',
		currentValue: 87500,
		previousValue: 92000,
		currentShare: 29,
		previousShare: 33,
		delta: -4.89,
	},
	{
		id: '3',
		label: 'Email campaign',
		currentValue: 53000,
		previousValue: 61000,
		currentShare: 18,
		previousShare: 22,
		delta: -13.11,
	},
	{
		id: '4',
		label: 'Social media',
		currentValue: 31500,
		previousValue: 28000,
		currentShare: 11,
		previousShare: 10,
		delta: 12.5,
	},
];

const mockLongLabelData: LeaderboardChartData = [
	{
		id: '1',
		label: 'Very Long Campaign Name That Might Need To Be Truncated',
		currentValue: 125000,
		previousValue: 98000,
		currentShare: 45,
		previousShare: 38,
		delta: 27.55,
	},
	{
		id: '2',
		label: 'Another Extremely Long Label For Testing',
		currentValue: 87500,
		previousValue: 92000,
		currentShare: 32,
		previousShare: 36,
		delta: -4.89,
	},
	{
		id: '3',
		label: 'Medium length label',
		currentValue: 63000,
		previousValue: 67000,
		currentShare: 23,
		previousShare: 26,
		delta: -5.97,
	},
];

/**
 * Default state showing leaderboard without comparison
 */
export const Default: Story = {
	args: {
		data: mockLeaderboardData,
		withComparison: false,
	},
};

/**
 * With comparison period enabled - shows delta and previous period data
 */
export const WithComparison: Story = {
	args: {
		data: mockLeaderboardData,
		withComparison: true,
		legendLabels: {
			primary: 'Jan 1 – 31, 2025',
			comparison: 'Dec 1 – 31, 2024',
		},
	},
};

/**
 * Loading state
 */
export const Loading: Story = {
	args: {
		data: mockLeaderboardData,
		loading: true,
		withComparison: true,
	},
};

/**
 * Empty state - no data available
 */
export const EmptyState: Story = {
	args: {
		data: [],
		emptyStateText: 'No data available for this period',
	},
};

/**
 * With overlay label - label displayed on top of bar
 */
export const WithOverlayLabel: Story = {
	args: {
		data: mockLeaderboardData,
		withOverlayLabel: true,
		withComparison: true,
	},
};

/**
 * Without legend
 */
export const WithoutLegend: Story = {
	args: {
		data: mockLeaderboardData,
		withComparison: true,
		showLegend: false,
	},
};

/**
 * With long labels to test truncation
 */
export const LongLabels: Story = {
	args: {
		data: mockLongLabelData,
		withComparison: true,
	},
};

/**
 * Number format (no currency)
 */
export const NumberFormat: Story = {
	args: {
		data: mockLeaderboardData,
		withComparison: true,
		dataFormat: {
			type: 'number',
			options: { useMultipliers: true, decimals: 0 },
		},
	},
};

/**
 * Percentage format - displays conversion rates as percentages
 */
export const PercentageFormat: Story = {
	args: {
		data: [
			{
				id: '1',
				label: 'Conversion rate A',
				currentValue: 0.0435,
				previousValue: 0.038,
				currentShare: 48,
				previousShare: 42,
				delta: 14.47,
			},
			{
				id: '2',
				label: 'Conversion rate B',
				currentValue: 0.0312,
				previousValue: 0.035,
				currentShare: 34,
				previousShare: 38,
				delta: -10.86,
			},
			{
				id: '3',
				label: 'Conversion rate C',
				currentValue: 0.0163,
				previousValue: 0.018,
				currentShare: 18,
				previousShare: 20,
				delta: -9.44,
			},
		],
		withComparison: true,
		dataFormat: {
			type: 'percentage',
			options: { decimals: 2 },
		},
	},
};

/*
 * Container Size Stories
 *
 * These stories demonstrate how the widget adapts to different container sizes.
 * Breakpoints aligned with Tailwind container query defaults.
 */

/**
 * Creates a decorator that wraps the story in a fixed-size container
 */
const createSizeDecorator = ( width: string, height = 'auto' ): Decorator => {
	return Story => (
		<div
			style={ {
				width,
				height,
				border: '1px dashed #ccc',
				borderRadius: '8px',
				padding: '16px',
				background: '#fafafa',
				containerType: 'inline-size',
				containerName: 'widget',
			} }
		>
			<Story />
		</div>
	);
};

/**
 * Extra extra small container (256px / xxs breakpoint)
 */
export const SizeXXSmall: Story = {
	args: {
		data: mockLeaderboardData,
		withComparison: true,
	},
	decorators: [ createSizeDecorator( '256px' ) ],
};

/**
 * Medium container (448px / md breakpoint)
 */
export const SizeMedium: Story = {
	args: {
		data: mockLeaderboardData,
		withComparison: true,
	},
	decorators: [ createSizeDecorator( '448px' ) ],
};

/**
 * Large container (576px / xl breakpoint)
 */
export const SizeLarge: Story = {
	args: {
		data: mockLeaderboardData,
		withComparison: true,
	},
	decorators: [ createSizeDecorator( '576px' ) ],
};

/**
 * Resizable: Demonstrates auto-resize behavior.
 * Drag the container edges to see the chart adapt to different widths.
 */
export const Resizable: Story = {
	decorators: [
		Story => (
			<div
				style={ {
					width: 400,
					height: 350,
					resize: 'both',
					overflow: 'auto',
					border: '1px dashed #ccc',
					padding: 16,
					minWidth: 200,
					maxWidth: 800,
				} }
			>
				<Story />
			</div>
		),
	],
	args: {
		data: mockLeaderboardData,
		withComparison: true,
	},
	parameters: {
		layout: 'padded',
	},
};
