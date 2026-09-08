/**
 * Internal dependencies
 */
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { getDefaultQueryParams, type PresetType } from '@jetpack-premium-analytics/data';
import {
	registerReportMocks,
	setReportMockState,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import {
	siteTimeZoneArgTypes,
	withSiteTimeZone,
	type SiteTimeZoneControls,
} from '../../stories/with-site-time-zone';
import WordAdsChartTabsRender from '../render';
import widgetDefinition from '../widget';
import widgetManifest from '../widget.json';
import type { IntervalType } from '@jetpack-premium-analytics/datetime';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentProps, ComponentType } from 'react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

registerReportMocks();

const WORDADS_CHART_TABS_RENDER_MODULE = 'storybook/wordads-chart-tabs';

// Mirror the header control's saved attributes. Each preset gets its own query-cache entry.
function renderOnPreset( preset: PresetType, interval: IntervalType ) {
	return () => (
		<WordAdsChartTabsRender
			attributes={ { reportParams: { ...getDefaultQueryParams( false, preset ), interval } } }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/WordAdsChartTabs',
	component: WordAdsChartTabsRender,
	tags: [ 'autodocs' ],
	decorators: [ withSiteTimeZone ],
	argTypes: {
		...siteTimeZoneArgTypes,
	},
	parameters: {
		docs: {
			description: {
				component:
					"WordAds performance over the selected period as selectable metric tabs — Ads Served, Average CPM, and Revenue, matching the Calypso WordAds page's tabs — over a line chart. Ads Served is a count; CPM and revenue are currency (WordAds pays USD). The widget hosts its own date range and bucket-size controls in its header, saved onto the widget instance; which metric is plotted is the chart's own tab selection. WordAds stats are computed nightly, so the last bucket of a range ending today stays empty until that run lands; only a range ending in the future is clamped back to today. Data comes from the `useStatsWordAdsStats` hook (the `wordads` proxy prefix); in Storybook it is served by `registerReportMocks`. Requires WordAds to be active on the site for live data.",
			},
		},
	},
} satisfies Meta< ComponentProps< typeof WordAdsChartTabsRender > & SiteTimeZoneControls >;

export default meta;

type Story = StoryObj< SiteTimeZoneControls >;
type DashboardStory = StoryObj< WidgetDashboardWithWidgetControls & SiteTimeZoneControls >;

/**
 * The widget on its own, on the range its header control defaults to.
 */
export const Default: Story = {
	render: renderOnPreset( 'last-30-days', 'day' ),
	decorators: [ withWidgetCanvas ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: renderOnPreset( 'last-90-days', 'week' ),
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
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
	render: renderOnPreset( 'last-7-days', 'day' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
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
	render: renderOnPreset( 'last-365-days', 'month' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'wordads/stats', 'empty' );
		return () => setReportMockState( 'wordads/stats', null );
	},
};

function WordAdsChartTabsDashboardStory( {
	...dashboardArgs
}: WidgetDashboardWithWidgetControls & SiteTimeZoneControls ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ createStoryWidgetType( widgetManifest, widgetDefinition ) }
			renderModule={ WORDADS_CHART_TABS_RENDER_MODULE }
			renderComponent={ WordAdsChartTabsRender as ComponentType< WidgetRenderProps< unknown > > }
			// The real header control edits this attribute; the harness renders the
			// widget's declared header, so the story starts it where the app does.
			attributes={ { reportParams: getDefaultQueryParams( false ) } }
		/>
	);
}

/**
 * Renders the real registered widget through the shared dashboard harness,
 * including the date control the widget declares in its own header.
 */
export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <WordAdsChartTabsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
	},
};
