import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import { withStoryRouter } from '../../stories/with-story-router';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import {
	forceStatsCommentsState,
	registerReportMocks,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import MostCommentedPostsRender from '../render';
import widgetDefinition from '../widget';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const MOST_COMMENTED_POSTS_RENDER_MODULE = 'storybook/most-commented-posts';

function renderMostCommentedPosts() {
	return <MostCommentedPostsRender attributes={ { reportParams: getDefaultQueryParams() } } />;
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/MostCommentedPosts',
	component: MostCommentedPostsRender,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'The "Most commented posts" widget. Ranks the posts and pages that receive the most comments, linking each row to the published post. One half of the Jetpack Stats Comments module; "Most commented authors" covers the other.',
			},
		},
	},
} satisfies Meta< typeof MostCommentedPostsRender >;

export default meta;

// No widget-specific story controls, so the story args are just the render
// component's (optional) props.
type Story = StoryObj< Partial< ComponentProps< typeof MostCommentedPostsRender > > >;

export const Default: Story = {
	render: renderMostCommentedPosts,
	decorators: [ withWidgetCanvas, withStoryRouter ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: renderMostCommentedPosts,
	// Kept off the shared autodocs page: the mock override is keyed by path, so it
	// would otherwise force the sibling stories on that page into the same state.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas, withStoryRouter ],
	beforeEach: forceStatsCommentsState( 'loading' ),
};

/**
 * A permission-gated 403: `describeError` maps it to neutral copy with no Retry
 * action, because the failure is deterministic.
 */
export const ErrorState: Story = {
	render: renderMostCommentedPosts,
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas, withStoryRouter ],
	beforeEach: forceStatsCommentsState( 'error' ),
};

/**
 * The proxy's `no_connection` 403: a broken Jetpack connection can heal, so this
 * one keeps its Retry action (which re-runs the query — still mocked as failing
 * while this story is active).
 */
export const RetryableErrorState: Story = {
	render: renderMostCommentedPosts,
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas, withStoryRouter ],
	beforeEach: forceStatsCommentsState( 'error-retryable' ),
};

/**
 * Resolved with no rows: the widget shows its empty state (the neutral comment
 * content glyph and "None of your posts or pages have comments yet.").
 */
export const Empty: Story = {
	render: renderMostCommentedPosts,
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas, withStoryRouter ],
	beforeEach: forceStatsCommentsState( 'empty' ),
};

function MostCommentedPostsDashboardStory( dashboardArgs: WidgetDashboardWithWidgetControls ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ createStoryWidgetType( widgetManifest, widgetDefinition ) }
			renderModule={ MOST_COMMENTED_POSTS_RENDER_MODULE }
			renderComponent={ MostCommentedPostsRender as ComponentType< WidgetRenderProps< unknown > > }
			// The report is all-time, so comparison params change nothing here; they
			// are passed anyway to cover the widget against inventing deltas when the
			// host supplies comparison dates.
			attributes={ { reportParams: getDefaultQueryParams( true ) } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< WidgetDashboardWithWidgetControls > = {
	render: args => <MostCommentedPostsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
	},
	decorators: [ withStoryRouter ],
};
