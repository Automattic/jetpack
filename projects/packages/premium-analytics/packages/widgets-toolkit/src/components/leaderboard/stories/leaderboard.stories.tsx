/**
 * External dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { WidgetCard } from '../../../stories/widget-card';
import { withWidgetRoot } from '../../../stories/with-widget-root';
import { ReportLink } from '../../report-link';
import { Leaderboard, type LeaderboardProps } from '../leaderboard';
import type { LeaderboardRowInput } from '../build-leaderboard-chart-data';
import type { Meta, StoryObj } from '@storybook/react';

const ROWS: LeaderboardRowInput[] = [
	{ id: '1', label: 'Getting Started Walkthrough', value: 3820, previousValue: 3000 },
	{ id: '2', label: 'Product Launch Highlights', value: 2640, previousValue: 2700 },
	{ id: '3', label: 'Customer Story: Acme', value: 1210, previousValue: 900 },
	{ id: '4', label: 'Behind the Scenes', value: 640 },
	{ id: '5', label: 'Q&A Session', value: 310, previousValue: 420 },
];

const READY = { isLoading: false, isError: false };

const meta: Meta< typeof Leaderboard > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/Leaderboard',
	component: Leaderboard,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'The ranked-rows widget body: hand it domain rows and the request status, and it renders the leaderboard chart with its loading, error and empty states, the shares against the largest value of either period, the deltas, and the dashboard window on detail links. Renders inside `WidgetRoot`.',
			},
		},
	},
	decorators: [
		Story => (
			<WidgetCard height="360px">
				<Story />
			</WidgetCard>
		),
		withWidgetRoot(),
	],
	args: {
		rows: ROWS,
		status: READY,
		footer: <ReportLink report="videos" />,
	},
};

export default meta;

type Story = StoryObj< LeaderboardProps >;

export const Default: Story = {};

export const WithComparison: Story = {
	args: { status: { ...READY, hasComparison: true } },
	decorators: [ withWidgetRoot( getDefaultQueryParams( true ) ) ],
};

export const WithMediaAndLinks: Story = {
	args: {
		rows: [
			{
				id: '1',
				label: 'Getting Started Walkthrough',
				value: 3820,
				action: { kind: 'videoLink', id: 101, href: 'https://example.com/video/101/' },
			},
			{
				id: '2',
				label: 'example.com',
				value: 2640,
				media: { kind: 'favicon', url: 'https://example.com/favicon.ico' },
				action: { kind: 'link', href: 'https://example.com' },
			},
			{ id: '3', label: 'Untitled video', value: 1210 },
		],
	},
};

export const Loading: Story = {
	args: { status: { isLoading: true } },
};

export const Error: Story = {
	args: {
		rows: [],
		status: { isLoading: false, isError: true, refetch: () => {} },
		error: { description: "We couldn't load video plays. Please try again in a moment." },
	},
};

export const Empty: Story = {
	args: { rows: [] },
};
