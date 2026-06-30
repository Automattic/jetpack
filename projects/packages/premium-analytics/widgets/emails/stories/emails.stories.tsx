/**
 * Like `top-posts` (the canonical non-time-series Stats widget), this story
 * exercises the presentational `EmailsLeaderboard` with fixtures rather than the
 * data-connected widget through `WidgetDashboardWithWidget`. `registerReportMocks`
 * only mocks the WC `analytics/reports` endpoints, not the Stats proxy that
 * `useStatsEmailSummary` hits, so a dashboard story would render only the empty
 * state. Fixtures let the populated states render without a backend.
 */
/**
 * Internal dependencies
 */
import { withChartTheme } from '../../../packages/widgets-toolkit/src/stories/with-chart-theme';
import { EmailsLeaderboard, type EmailRow } from '../render';
import type { Meta, StoryObj, Decorator } from '@storybook/react';

const meta: Meta< typeof EmailsLeaderboard > = {
	title: 'Packages/Premium Analytics/Widgets/Emails',
	component: EmailsLeaderboard,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'The "Emails" widget. Lists the most recently sent emails with a selector to switch between open rate and click rate, rendered as a leaderboard. This is the presentational layer — it takes already-fetched rows via props and handles the loading, error, empty, and populated states. The data-connected widget (render.tsx default export) wraps this in WidgetRoot and feeds it the useStatsEmailSummary hook.',
			},
		},
	},
	decorators: [ withChartTheme ],
};

export default meta;

type Story = StoryObj< typeof EmailsLeaderboard >;

const mockRows: EmailRow[] = [
	{
		id: 1,
		label: '4 Ways to Make Your Website Stand Out',
		opensRate: 38.1,
		clicksRate: 3.81,
	},
	{
		id: 2,
		label: 'Develop Locally on Linux with WordPress.com',
		opensRate: 41.2,
		clicksRate: 5.98,
	},
	{
		id: 3,
		label: '10 Brand-New WordPress.com Themes for 2026',
		opensRate: 35.7,
		clicksRate: 7.12,
	},
	{
		id: 4,
		label: 'WordPress.com Is Now Available in More Languages',
		opensRate: 52.4,
		clicksRate: 8.93,
	},
	{
		id: 5,
		label: 'WordCamp Europe 2026: What to Expect',
		opensRate: 47.9,
		clicksRate: 10.25,
	},
	{
		id: 6,
		label: 'Click, Comment, Done: A Better Way to Collaborate',
		opensRate: 44.3,
		clicksRate: 10.38,
	},
];

const mockLongLabelRows: EmailRow[] = [
	{
		id: 1,
		label:
			'An exhaustively long, keyword-stuffed subject line that almost certainly needs to be truncated before it overflows the row',
		opensRate: 22.5,
		clicksRate: 4.1,
	},
	{
		id: 2,
		label: 'Your monthly digest: billing, new features, and what is coming next',
		opensRate: 33.8,
		clicksRate: 6.7,
	},
];

/**
 * Default populated state — latest emails ranked by open rate.
 */
export const Default: Story = {
	args: {
		rows: mockRows,
	},
};

/**
 * Click-rate view — the selector defaults to click rate instead of open rate.
 */
export const ByClickRate: Story = {
	args: {
		rows: mockRows,
		initialMetric: 'clicks',
	},
};

/**
 * Loading state — the loading overlay renders while data is fetched.
 */
export const Loading: Story = {
	args: {
		rows: [],
		isLoading: true,
	},
};

/**
 * Empty state — no emails have been sent yet.
 */
export const Empty: Story = {
	args: {
		rows: [],
	},
};

/**
 * Error state — the report could not be loaded.
 */
export const ErrorState: Story = {
	args: {
		isError: true,
	},
};

/**
 * Long subject lines are truncated with an ellipsis so rows stay single-line.
 */
export const LongLabels: Story = {
	args: {
		rows: mockLongLabelRows,
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
		rows: mockRows,
	},
	decorators: [ createSizeDecorator( '448px' ) ],
};

/**
 * Large container (576px / xl breakpoint).
 */
export const SizeLarge: Story = {
	args: {
		rows: mockRows,
	},
	decorators: [ createSizeDecorator( '576px' ) ],
};
