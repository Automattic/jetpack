/**
 * External dependencies
 */
import { getDefaultQueryParams, type PresetType } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import { registerStatsMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-stats-mocks';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { forceStatsMockState } from '../../stories/force-stats-mock-state';
import { withStoryRouter } from '../../stories/with-story-router';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import TopPostsRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps, WidgetType } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();
registerStatsMocks();

const TOP_POSTS_RENDER_MODULE = 'storybook/top-posts';

const storyWidgetType = {
	name: widgetDefinition.name,
	title: widgetDefinition.title,
	icon: widgetDefinition.icon,
	// Attribute metadata drives the host-rendered chrome: the high-relevance
	// `contentView` control in the framed header and the settings fields.
	attributes: widgetDefinition.attributes as WidgetType[ 'attributes' ],
	example: widgetDefinition.example,
	presentation: 'framed' as const,
};

interface TopPostsStoryControls {
	withComparison: boolean;
	contentView: 'posts' | 'archives';
}

interface TopPostsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		TopPostsStoryControls {}

const withTopPostsCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '340px' } }>
		<Story />
	</div>
);

function renderTopPostsWidget( { withComparison, contentView }: TopPostsStoryControls ) {
	return (
		<TopPostsRender
			attributes={ {
				num: 10,
				contentView,
				reportParams: getDefaultQueryParams( withComparison ),
			} }
		/>
	);
}

function TopPostsDashboardStory( {
	withComparison,
	contentView,
	...dashboardArgs
}: TopPostsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ TOP_POSTS_RENDER_MODULE }
			renderComponent={ TopPostsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ {
				num: 10,
				contentView,
				reportParams: getDefaultQueryParams( withComparison ),
			} }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/TopPosts',
	component: TopPostsRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params and deltas.',
		},
		contentView: {
			control: 'inline-radio',
			options: [ 'posts', 'archives' ],
			description:
				'Which report the widget shows: posts & pages, or aggregate archive-page views. Rendered as an inline control in the widget frame header by the host.',
		},
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Most viewed" widget. Shows the most-viewed posts and pages as a ranked leaderboard, using the global dashboard date range; each row links to the published content, and the homepage-as-latest-posts views from the archives report are folded into the list. The `contentView` attribute switches to aggregate archive-page views (taxonomy, post-type, search, and date archives).',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof TopPostsRender > & TopPostsStoryControls >;

export default meta;

type Story = StoryObj< TopPostsStoryControls >;
type DashboardStory = StoryObj< TopPostsDashboardStoryProps >;

export const Default: Story = {
	render: renderTopPostsWidget,
	args: { withComparison: false, contentView: 'posts' },
	decorators: [ withTopPostsCanvas, withStoryRouter ],
};

export const WithComparison: Story = {
	render: renderTopPostsWidget,
	args: { withComparison: true, contentView: 'posts' },
	decorators: [ withTopPostsCanvas, withStoryRouter ],
};

export const Archives: Story = {
	render: renderTopPostsWidget,
	args: { withComparison: true, contentView: 'archives' },
	decorators: [ withTopPostsCanvas, withStoryRouter ],
	parameters: {
		docs: {
			description: {
				story:
					'The Archives view: one aggregate row per archive type (taxonomy, post-type, and search archives), with comparison deltas when the previous period overlaps. Grouped rows drill down into their individual archive pages (taxonomies drill twice: taxonomy → terms) with a back link, following the Locations/Clicks drill-down convention. The homepage entry is surfaced in the Posts & pages view instead, matching the Stats card.',
			},
		},
	},
};

export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <TopPostsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
		contentView: 'posts',
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params and deltas.',
		},
	},
};

// Distinct preset → own query-cache entry; see forceStatsMockState.
function renderTopPostsOnPreset( preset: PresetType ) {
	return (
		<TopPostsRender
			attributes={ {
				num: 10,
				contentView: 'posts',
				reportParams: getDefaultQueryParams( false, preset ),
			} }
		/>
	);
}

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: () => renderTopPostsOnPreset( 'last-90-days' ),
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas, withStoryRouter ],
	beforeEach: () => {
		forceStatsMockState( 'stats/top-posts', 'loading' );
		return () => forceStatsMockState( 'stats/top-posts', null );
	},
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: Story = {
	render: () => renderTopPostsOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas, withStoryRouter ],
	beforeEach: () => {
		forceStatsMockState( 'stats/top-posts', 'error' );
		return () => forceStatsMockState( 'stats/top-posts', null );
	},
};

/**
 * Resolved with no rows: the widget shows its empty state (the neutral chart
 * glyph and "No views in this period.").
 */
export const Empty: Story = {
	render: () => renderTopPostsOnPreset( 'last-365-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas, withStoryRouter ],
	beforeEach: () => {
		forceStatsMockState( 'stats/top-posts', 'empty' );
		return () => forceStatsMockState( 'stats/top-posts', null );
	},
};
