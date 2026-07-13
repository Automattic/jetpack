/**
 * External dependencies
 */
import { getDefaultQueryParams, type PresetType } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import {
	registerReportMocks,
	setReportMockState,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import { withChartTheme } from '../../../packages/widgets-toolkit/src/stories/with-chart-theme';
import TopPostsWidget, { TopPostsLeaderboard, type TopPostRow } from '../render';
import type { Meta, StoryObj, Decorator } from '@storybook/react';

registerReportMocks();

const meta: Meta< typeof TopPostsLeaderboard > = {
	title: 'Packages/Premium Analytics/Widgets/TopPosts',
	component: TopPostsLeaderboard,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'The "Top posts & pages" widget. Renders the most-viewed posts and pages for the period as a leaderboard, with each row linking to the published content. This is the presentational layer — it takes already-fetched rows via props and renders only the populated (ready) state; loading, error, and empty are handled by <WidgetState> in the data-connected widget (render.tsx default export), which wraps this in WidgetRoot and feeds it the designated useStatsTopPosts hook.',
			},
		},
	},
	decorators: [ withChartTheme ],
};

export default meta;

type Story = StoryObj< typeof TopPostsLeaderboard >;

const mockRows: TopPostRow[] = [
	{
		label: 'How we cut our build times in half',
		value: 12840,
		previousValue: 9870,
		href: 'https://example.com/cut-build-times-in-half',
		type: 'post',
	},
	{
		label: 'Pricing',
		value: 9320,
		previousValue: 10110,
		href: 'https://example.com/pricing',
		type: 'page',
	},
	{
		label: '10 lessons from scaling to a million users',
		value: 7610,
		previousValue: 5400,
		href: 'https://example.com/lessons-scaling-million-users',
		type: 'post',
	},
	{
		label: 'About us',
		value: 4180,
		previousValue: 4360,
		href: 'https://example.com/about',
		type: 'page',
	},
	{
		label: 'A practical guide to feature flags',
		value: 2950,
		previousValue: 0,
		href: 'https://example.com/guide-to-feature-flags',
		type: 'post',
	},
];

const mockLongLabelRows: TopPostRow[] = [
	{
		label:
			'An exhaustively long, keyword-stuffed headline that almost certainly needs to be truncated before it overflows the row',
		value: 8400,
		href: 'https://example.com/very-long-headline-that-needs-truncation',
		type: 'post',
	},
	{
		label: 'Frequently asked questions about billing, refunds, and account management',
		value: 5120,
		href: 'https://example.com/faq-billing-refunds-account-management',
		type: 'page',
	},
	{
		label: 'Changelog',
		value: 2010,
		href: 'https://example.com/changelog',
		type: 'page',
	},
];

/**
 * Default populated state — a mix of posts and pages ranked by views.
 */
export const Default: Story = {
	args: {
		rows: mockRows,
	},
};

/**
 * Comparison state — each value shows its change versus the previous period
 * (green for gains, red for losses), driven by each row's `previousValue`.
 * Mirrors the overlay comparison mode of the toolkit's `LeaderboardChart`.
 */
export const WithComparison: Story = {
	args: {
		rows: mockRows,
		withComparison: true,
		showLegend: true,
		legendLabels: {
			primary: 'Jun 1 – 18, 2026',
			comparison: 'May 14 – 31, 2026',
		},
	},
};

/**
 * Long titles are truncated with an ellipsis so rows stay single-line.
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

// Renders the data-connected widget on a preset distinct from the other
// stories. The query key derives from the date range, so a unique preset gives
// the forced-state stories their own cache entry and they hit the mock fresh
// instead of reading another story's cached success from the shared query
// client.
function renderTopPostsOnPreset( preset: PresetType ) {
	return (
		<TopPostsWidget
			attributes={ { num: 10, reportParams: getDefaultQueryParams( false, preset ) } }
		/>
	);
}

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: () => renderTopPostsOnPreset( 'last-90-days' ),
	// Kept off the shared autodocs page: the mock override is keyed by path, so it
	// would otherwise force the sibling stories on that page into the same state.
	tags: [ '!autodocs' ],
	decorators: [ createSizeDecorator( '448px', '360px' ) ],
	beforeEach: () => {
		setReportMockState( 'stats/top-posts', 'loading' );
		return () => setReportMockState( 'stats/top-posts', null );
	},
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: Story = {
	render: () => renderTopPostsOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ createSizeDecorator( '448px', '360px' ) ],
	beforeEach: () => {
		setReportMockState( 'stats/top-posts', 'error' );
		return () => setReportMockState( 'stats/top-posts', null );
	},
};

/**
 * Resolved with no rows: the widget shows its empty state (the neutral chart
 * glyph and "No views in this period.").
 */
export const Empty: Story = {
	render: () => renderTopPostsOnPreset( 'last-365-days' ),
	tags: [ '!autodocs' ],
	decorators: [ createSizeDecorator( '448px', '360px' ) ],
	beforeEach: () => {
		setReportMockState( 'stats/top-posts', 'empty' );
		return () => setReportMockState( 'stats/top-posts', null );
	},
};
