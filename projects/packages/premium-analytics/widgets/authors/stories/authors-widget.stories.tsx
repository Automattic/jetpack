/**
 * Internal dependencies
 */
import { withChartTheme } from '../../../packages/widgets-toolkit/src/stories/with-chart-theme';
import { AuthorsLeaderboard } from '../render';
import type { LeaderboardChartData } from '@jetpack-premium-analytics/widgets-toolkit';
import type { Decorator, Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof AuthorsLeaderboard > = {
	title: 'Packages/Premium Analytics/Widgets/Authors',
	component: AuthorsLeaderboard,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					"The Authors widget. Renders the site's top authors by views as a leaderboard, sourced from the Jetpack Stats API, with optional period-over-period comparison. This is the presentational component — it takes already-built leaderboard rows via props and handles the loading, empty, and populated states.",
			},
		},
	},
	decorators: [ withChartTheme ],
};

export default meta;

type Story = StoryObj< typeof AuthorsLeaderboard >;

const MAX_VIEWS = 4820;

/**
 * Compute the share (0–100) of a value relative to the most-viewed author, so
 * the overlay bars stay proportional — mirroring `buildTopAuthorsData`.
 *
 * @param value - The view count.
 * @return The share as a percentage of the top author's views.
 */
const share = ( value: number ) => ( value / MAX_VIEWS ) * 100;

const mockAuthors: LeaderboardChartData = [
	{
		id: 'Jane Cooper',
		label: 'Jane Cooper',
		currentValue: 4820,
		previousValue: 0,
		currentShare: share( 4820 ),
		previousShare: 0,
		delta: 0,
	},
	{
		id: 'Wade Warren',
		label: 'Wade Warren',
		currentValue: 3110,
		previousValue: 0,
		currentShare: share( 3110 ),
		previousShare: 0,
		delta: 0,
	},
	{
		id: 'Esther Howard',
		label: 'Esther Howard',
		currentValue: 2540,
		previousValue: 0,
		currentShare: share( 2540 ),
		previousShare: 0,
		delta: 0,
	},
	{
		id: 'Cameron Williamson',
		label: 'Cameron Williamson',
		currentValue: 1890,
		previousValue: 0,
		currentShare: share( 1890 ),
		previousShare: 0,
		delta: 0,
	},
	{
		id: 'Brooklyn Simmons',
		label: 'Brooklyn Simmons',
		currentValue: 1320,
		previousValue: 0,
		currentShare: share( 1320 ),
		previousShare: 0,
		delta: 0,
	},
	{
		id: 'Leslie Alexander',
		label: 'Leslie Alexander',
		currentValue: 760,
		previousValue: 0,
		currentShare: share( 760 ),
		previousShare: 0,
		delta: 0,
	},
	{
		id: 'Untracked authors',
		label: 'Untracked authors',
		currentValue: 410,
		previousValue: 0,
		currentShare: share( 410 ),
		previousShare: 0,
		delta: 0,
	},
];

const mockAuthorsWithComparison: LeaderboardChartData = [
	{
		id: 'Jane Cooper',
		label: 'Jane Cooper',
		currentValue: 4820,
		previousValue: 3900,
		currentShare: share( 4820 ),
		previousShare: share( 3900 ),
		delta: 23.6,
	},
	{
		id: 'Wade Warren',
		label: 'Wade Warren',
		currentValue: 3110,
		previousValue: 3540,
		currentShare: share( 3110 ),
		previousShare: share( 3540 ),
		delta: -12.1,
	},
	{
		id: 'Esther Howard',
		label: 'Esther Howard',
		currentValue: 2540,
		previousValue: 1980,
		currentShare: share( 2540 ),
		previousShare: share( 1980 ),
		delta: 28.3,
	},
	{
		id: 'Cameron Williamson',
		label: 'Cameron Williamson',
		currentValue: 1890,
		previousValue: 2010,
		currentShare: share( 1890 ),
		previousShare: share( 2010 ),
		delta: -6,
	},
	{
		id: 'Brooklyn Simmons',
		label: 'Brooklyn Simmons',
		currentValue: 1320,
		previousValue: 0,
		currentShare: share( 1320 ),
		previousShare: 0,
		delta: 100,
	},
];

/**
 * Default populated state — top authors ranked by views for the period.
 */
export const Default: Story = {
	args: {
		data: mockAuthors,
	},
};

/**
 * Comparison state — each value shows its change versus the previous period
 * (green for gains, red for losses), driven by each row's `previousValue`.
 */
export const WithComparison: Story = {
	args: {
		data: mockAuthorsWithComparison,
		withComparison: true,
		legendLabels: {
			primary: 'Jun 1 – 18, 2026',
			comparison: 'May 14 – 31, 2026',
		},
	},
};

/**
 * Loading state — the initial loading overlay renders while data is fetched.
 */
export const Loading: Story = {
	args: {
		data: [],
		isLoading: true,
	},
};

/**
 * Empty state — no authors recorded any views for the selected period.
 */
export const Empty: Story = {
	args: {
		data: [],
	},
};

/**
 * Creates a decorator that wraps the story in a fixed-size container so the
 * widget's responsiveness can be inspected at a given width.
 *
 * @param width    - The container width (any CSS length).
 * @param [height] - The container height; defaults to `auto`.
 * @return A Storybook decorator.
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
 * Medium container (448px / md breakpoint).
 */
export const SizeMedium: Story = {
	args: {
		data: mockAuthors,
	},
	decorators: [ createSizeDecorator( '448px' ) ],
};

/**
 * Large container (576px / xl breakpoint).
 */
export const SizeLarge: Story = {
	args: {
		data: mockAuthors,
	},
	decorators: [ createSizeDecorator( '576px' ) ],
};
