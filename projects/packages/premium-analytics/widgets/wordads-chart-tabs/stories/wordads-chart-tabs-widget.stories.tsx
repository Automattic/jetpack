/**
 * Internal dependencies
 */
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import {
	registerReportMocks,
	setReportMockState,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import { RouteHarness } from '../route-harness';
import WordAdsChartTabsRender from '../render';
import widgetDefinition from '../widget';
import widgetManifest from '../widget.json';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

registerReportMocks();

/**
 * Mount a story under a matched `/` route with the given search params.
 *
 * @param search - Initial search params for the `/` route.
 * @return A Storybook decorator.
 */
function withStoryRouteSearch( search: Record< string, string > ): Decorator {
	return Story => (
		<RouteHarness search={ search }>
			<Story />
		</RouteHarness>
	);
}

const WORDADS_CHART_TABS_RENDER_MODULE = 'storybook/wordads-chart-tabs';

function renderWordAdsChartTabs() {
	return <WordAdsChartTabsRender attributes={ {} } />;
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/WordAdsChartTabs',
	component: WordAdsChartTabsRender,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					"WordAds performance over the selected period as selectable metric tabs — Ads Served, Average CPM, and Revenue, matching the Calypso WordAds page's tabs — over a line chart. Ads Served is a count; CPM and revenue are currency (WordAds pays USD). The widget hosts its own date range and bucket-size controls, writing the shared URL search params; which metric is plotted is the chart's own tab selection. WordAds stats are computed nightly, so a range ending today is clamped to end at yesterday. Data comes from the `useStatsWordAdsStats` hook (the `wordads` proxy prefix); in Storybook it is served by `registerReportMocks`. Requires WordAds to be active on the site for live data.",
			},
		},
	},
} satisfies Meta< typeof WordAdsChartTabsRender >;

export default meta;

type Story = StoryObj< Record< string, never > >;
type DashboardStory = StoryObj< WidgetDashboardWithWidgetControls >;

export const Default: Story = {
	render: renderWordAdsChartTabs,
	decorators: [
		withStoryRouteSearch( { preset: 'last-30-days', interval: 'day' } ),
		withWidgetCanvas,
	],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: renderWordAdsChartTabs,
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [
		withStoryRouteSearch( { preset: 'last-90-days', interval: 'week' } ),
		withWidgetCanvas,
	],
	beforeEach: () => {
		setReportMockState( 'wordads/stats', 'loading' );
		return () => setReportMockState( 'wordads/stats', null );
	},
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: Story = {
	render: renderWordAdsChartTabs,
	tags: [ '!autodocs' ],
	decorators: [
		withStoryRouteSearch( { preset: 'last-7-days', interval: 'day' } ),
		withWidgetCanvas,
	],
	beforeEach: () => {
		setReportMockState( 'wordads/stats', 'error' );
		return () => setReportMockState( 'wordads/stats', null );
	},
};

/**
 * Resolved with no rows: the widget shows its empty state (the neutral megaphone
 * glyph and "No WordAds data in this period.").
 */
export const Empty: Story = {
	render: renderWordAdsChartTabs,
	tags: [ '!autodocs' ],
	decorators: [
		withStoryRouteSearch( { preset: 'last-365-days', interval: 'month' } ),
		withWidgetCanvas,
	],
	beforeEach: () => {
		setReportMockState( 'wordads/stats', 'empty' );
		return () => setReportMockState( 'wordads/stats', null );
	},
};

/*
 * The dashboard story provides router context but no matched route. Put the
 * harness inside that context through `renderComponent` so the date hooks work.
 */
function WordAdsChartTabsWithOwnRoute( props: WidgetRenderProps< unknown > ) {
	return (
		<RouteHarness search={ { preset: 'last-30-days', interval: 'day' } }>
			<WordAdsChartTabsRender { ...props } />
		</RouteHarness>
	);
}

function WordAdsChartTabsDashboardStory( dashboardArgs: WidgetDashboardWithWidgetControls ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ createStoryWidgetType( widgetManifest, widgetDefinition ) }
			renderModule={ WORDADS_CHART_TABS_RENDER_MODULE }
			renderComponent={ WordAdsChartTabsWithOwnRoute }
			attributes={ {} }
		/>
	);
}

export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <WordAdsChartTabsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
	},
};
