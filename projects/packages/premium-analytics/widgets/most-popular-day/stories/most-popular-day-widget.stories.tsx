/**
 * The stories render the data-connected widget fed by the shared
 * report-mock harness. `registerReportMocks` routes the `stats/` site summary
 * (`/proxy/v1.1/stats`) — including the `views_best_day*` fields this widget
 * reads — through `routeStatsReport()`, so no story-scoped middleware is needed.
 */
/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import {
	registerReportMocks,
	setReportMockState,
	type ReportMockState,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import MostPopularDayRender from '../render';
import widgetDefinition from '../widget';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const MOST_POPULAR_DAY_RENDER_MODULE = 'storybook/most-popular-day';

// Path fragment of the site-summary request (`useStatsSite` hits the bare
// `/proxy/v1.1/stats` endpoint). It is a prefix of every Stats proxy path, but
// the forced-state stories render only this widget, so nothing else matches.
const SITE_SUMMARY_PATH_FRAGMENT = 'proxy/v1.1/stats';

/**
 * Forces the site-summary request into the given state for a story's lifetime.
 *
 * `useStatsSite()` has a constant query key — the all-time summary ignores the
 * dashboard date range — so distinct date presets cannot give the forced-state
 * stories their own cache entries. Instead, drop the cached summary from the
 * shared query client so the widget re-fetches and hits the forced mock, and
 * drop it again on cleanup so a forced empty/error result doesn't leak into the
 * other stories' shared cache entry.
 */
function forceSiteSummaryState( state: ReportMockState ) {
	queryClient.removeQueries( { queryKey: [ 'stats', 'site' ] } );
	setReportMockState( SITE_SUMMARY_PATH_FRAGMENT, state );
	return () => {
		setReportMockState( SITE_SUMMARY_PATH_FRAGMENT, null );
		queryClient.removeQueries( { queryKey: [ 'stats', 'site' ] } );
	};
}

function renderMostPopularDay() {
	return <MostPopularDayRender attributes={ { reportParams: getDefaultQueryParams() } } />;
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/MostPopularDay',
	component: MostPopularDayRender,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'The "Most popular day" widget ports the Jetpack Stats all-time highlight: the single day your site drew the most views, with that day\'s view count and its share of all views. The value comes from a site-wide summary that does not depend on the dashboard date range.',
			},
		},
	},
} satisfies Meta< typeof MostPopularDayRender >;

export default meta;

type Story = StoryObj< Partial< ComponentProps< typeof MostPopularDayRender > > >;

/**
 * Default state — the best day for views and its share of all views.
 */
export const Default: Story = {
	render: renderMostPopularDay,
	decorators: [ withWidgetCanvas ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: renderMostPopularDay,
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => forceSiteSummaryState( 'loading' ),
};

/**
 * The reader cannot see this site's stats — a permission-gated 403. The widget
 * states that neutrally and offers no Retry, which could not help.
 */
export const Error: Story = {
	render: renderMostPopularDay,
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => forceSiteSummaryState( 'error' ),
};

/**
 * The fetch failed in a way that can heal — the proxy's `no_connection` 403: the
 * widget shows its retryable copy with a Retry action, which re-runs the query
 * (still mocked as failing while this story is active).
 */
export const ErrorRetryable: Story = {
	render: renderMostPopularDay,
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => forceSiteSummaryState( 'error-retryable' ),
};

/**
 * Resolved without a usable `views_best_day`: the widget shows its empty state
 * (the neutral calendar glyph and the "not enough views" message).
 */
export const Empty: Story = {
	render: renderMostPopularDay,
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => forceSiteSummaryState( 'empty' ),
};

function MostPopularDayDashboardStory( dashboardArgs: WidgetDashboardWithWidgetControls ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ createStoryWidgetType( widgetManifest, widgetDefinition ) }
			renderModule={ MOST_POPULAR_DAY_RENDER_MODULE }
			renderComponent={ MostPopularDayRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( true ) } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< WidgetDashboardWithWidgetControls > = {
	render: args => <MostPopularDayDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
	},
};
