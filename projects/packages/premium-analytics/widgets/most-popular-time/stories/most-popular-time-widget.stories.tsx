/**
 * The stories render the data-connected widget through `WidgetRoot`, so
 * they need report data to resolve against. `registerReportMocks` covers the
 * shared paths, including the `stats/insights` fixture wired into
 * `routeStatsReport()`.
 */
/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import {
	registerReportMocks,
	setReportMockState,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import MostPopularTimeRender from '../render';
import widgetDefinition from '../widget';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const MOST_POPULAR_TIME_RENDER_MODULE = 'storybook/most-popular-time';

const INSIGHTS_PATH_FRAGMENT = 'stats/insights';

/**
 * Forces the insights request into the given state for a story's lifetime.
 *
 * `useStatsInsights()` has a constant query key — the insights report covers a
 * fixed server-side window and ignores the dashboard date range — so distinct
 * date presets cannot give the forced-state stories their own cache entries.
 * Instead, drop the cached report from the shared query client so the widget
 * re-fetches and hits the forced mock, and drop it again on cleanup so a forced
 * empty/error result doesn't leak into the other stories' shared cache entry.
 */
function forceInsightsState( state: 'loading' | 'error' | 'empty' ) {
	queryClient.removeQueries( { queryKey: [ 'stats', 'insights' ] } );
	setReportMockState( INSIGHTS_PATH_FRAGMENT, state );
	return () => {
		setReportMockState( INSIGHTS_PATH_FRAGMENT, null );
		queryClient.removeQueries( { queryKey: [ 'stats', 'insights' ] } );
	};
}

function renderMostPopularTime() {
	return <MostPopularTimeRender attributes={ { reportParams: getDefaultQueryParams() } } />;
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/MostPopularTime',
	component: MostPopularTimeRender,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'The "Most popular time" widget. Shows the day of week and hour of day that draw the most views, each with its share of the total. The insights endpoint reports over a fixed server-side window, so there is no date range or comparison period.',
			},
		},
	},
} satisfies Meta< typeof MostPopularTimeRender >;

export default meta;

type Story = StoryObj< Partial< ComponentProps< typeof MostPopularTimeRender > > >;

/**
 * Default state — the peak day and hour highlights.
 */
export const Default: Story = {
	render: renderMostPopularTime,
	decorators: [ withWidgetCanvas ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: renderMostPopularTime,
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => forceInsightsState( 'loading' ),
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: Story = {
	render: renderMostPopularTime,
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => forceInsightsState( 'error' ),
};

/**
 * Resolved without peak day/hour data: the widget shows its empty state, under
 * the widget's own `scheduled` glyph rather than the error state's icon.
 */
export const Empty: Story = {
	render: renderMostPopularTime,
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => forceInsightsState( 'empty' ),
};

function MostPopularTimeDashboardStory( dashboardArgs: WidgetDashboardWithWidgetControls ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ createStoryWidgetType( widgetManifest, widgetDefinition ) }
			renderModule={ MOST_POPULAR_TIME_RENDER_MODULE }
			renderComponent={ MostPopularTimeRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( true ) } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< WidgetDashboardWithWidgetControls > = {
	render: args => <MostPopularTimeDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
	},
};
