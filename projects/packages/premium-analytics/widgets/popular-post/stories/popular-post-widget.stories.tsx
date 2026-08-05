/**
 * The widget ranks posts with the proxied `stats/top-posts` endpoint (covered by
 * the legacy stats mocks), then reads the winning post's content from the local
 * `/wp/v2/posts` endpoint and all three of its all-time metrics from `stats/post/{id}`
 * (both covered by the shared report mocks).
 */
/**
 * External dependencies
 */
import { getDefaultQueryParams, type PresetType } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import { registerStatsMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-stats-mocks';
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import { forceStatsMockState } from '../../stories/force-stats-mock-state';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { withStoryRouter } from '../../stories/with-story-router';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import PopularPostRender from '../render';
import widgetDefinition from '../widget';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();
registerStatsMocks();

const POPULAR_POST_RENDER_MODULE = 'storybook/popular-post';

/**
 * Renders the data-connected widget with report params from the date range
 * picker.
 * @return The rendered widget.
 */
function renderPopularPost() {
	return <PopularPostRender attributes={ { reportParams: getDefaultQueryParams() } } />;
}

// Distinct preset → own query-cache entry; see forceStatsMockState.
function renderPopularPostOnPreset( preset: PresetType ) {
	return (
		<PopularPostRender attributes={ { reportParams: getDefaultQueryParams( false, preset ) } } />
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/PopularPost',
	component: PopularPostRender,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'The "Popular post" widget shows the site\'s most-viewed post for the dashboard\'s date range, with its publish date and its all-time views, likes, and comments. Changing the date range changes which post wins, not the totals shown for it: every tile comes from the all-time `stats/post` response, so the three cannot measure different periods. There is no `WithComparison` story: the card shows no period-over-period delta, so the dashboard story below carries the comparison report params instead.',
			},
		},
	},
} satisfies Meta< typeof PopularPostRender >;

export default meta;

type Story = StoryObj< Partial< ComponentProps< typeof PopularPostRender > > >;

/**
 * Default — the period's most-viewed post with its all-time views, likes, and comments.
 *
 * The shared close-up canvas is the width of a width-1 dashboard cell, which is
 * below the card's 520px wide breakpoint: the featured image is dropped and the
 * metric row wraps. `WidgetDashboardWithWidget` below shows the default width-2
 * placement, where the image sits in a trailing column.
 */
export const Default: Story = {
	render: renderPopularPost,
	decorators: [ withWidgetCanvas, withStoryRouter ],
};

/**
 * First load: the ranking request is in flight, so the widget shows its loading
 * state. The mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: () => renderPopularPostOnPreset( 'last-90-days' ),
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas, withStoryRouter ],
	beforeEach: () => {
		forceStatsMockState( 'stats/top-posts', 'loading' );
		return () => forceStatsMockState( 'stats/top-posts', null );
	},
};

/**
 * A permission-gated 403: `describeError` maps it to neutral copy with no Retry
 * action, because the failure is deterministic.
 */
export const Error: Story = {
	render: () => renderPopularPostOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas, withStoryRouter ],
	beforeEach: () => {
		forceStatsMockState( 'stats/top-posts', 'error' );
		return () => forceStatsMockState( 'stats/top-posts', null );
	},
};

/**
 * The proxy's `no_connection` 403: a broken Jetpack connection can heal, so
 * `describeError` keeps this one retryable.
 */
export const ErrorRetryable: Story = {
	render: () => renderPopularPostOnPreset( 'last-12-months' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas, withStoryRouter ],
	beforeEach: () => {
		forceStatsMockState( 'stats/top-posts', 'error-retryable' );
		return () => forceStatsMockState( 'stats/top-posts', null );
	},
};

/**
 * Resolved with no rows: the widget shows its empty state.
 */
export const Empty: Story = {
	// A calendar year, not a rolling window: `last-365-days` and `last-12-months`
	// resolve to the same dates most years, which would share ErrorRetryable's
	// query key and serve this story's cached empty result there instead.
	render: () => renderPopularPostOnPreset( 'last-year' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas, withStoryRouter ],
	beforeEach: () => {
		forceStatsMockState( 'stats/top-posts', 'empty' );
		return () => forceStatsMockState( 'stats/top-posts', null );
	},
};

/**
 * Mounts the real `WidgetDashboard` with this single widget so it renders exactly
 * as it does in product (framed card, sizing, edit mode). Drop `widgetWidth` to 1
 * to walk the card's size ladder: below 520px wide the featured image drops out and
 * the metric row wraps. Shortening the cell below 300px also switches the card to
 * its compact type scale.
 *
 * Comparison report params are passed unconditionally, so the widget stays covered
 * against crashing or inventing deltas when the host supplies comparison dates.
 *
 * @param {WidgetDashboardWithWidgetControls} dashboardArgs - The dashboard story controls.
 * @return The widget mounted inside the real dashboard.
 */
function PopularPostDashboardStory( dashboardArgs: WidgetDashboardWithWidgetControls ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ createStoryWidgetType( widgetManifest, widgetDefinition ) }
			renderModule={ POPULAR_POST_RENDER_MODULE }
			renderComponent={ PopularPostRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( true ) } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< WidgetDashboardWithWidgetControls > = {
	render: args => <PopularPostDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		// Popular post is a landscape widget: content left, featured image right.
		widgetWidth: 2,
		widgetHeight: 2,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
	},
};

/**
 * A short cell at the default width. Height, not just width, drives the card:
 * below 300px of body the type scale steps down and the featured image becomes a
 * centred square instead of a full-height panel.
 *
 * This geometry regressed once — the metric row was pushed past the card's bottom
 * edge and silently clipped, leaving labels with no values — so it is covered
 * here to keep a height regression visible in review.
 */
export const ShortCell: StoryObj< WidgetDashboardWithWidgetControls > = {
	render: args => <PopularPostDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		widgetWidth: 2,
		widgetHeight: 1,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
	},
};

/**
 * The smallest cell the dashboard grid produces: narrow *and* short. The featured
 * image drops out entirely and the headline clamps to one line, but the whole
 * metric row — every label with its value — stays inside the card.
 */
export const ShortNarrowCell: StoryObj< WidgetDashboardWithWidgetControls > = {
	render: args => <PopularPostDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		widgetWidth: 1,
		widgetHeight: 1,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
	},
};
