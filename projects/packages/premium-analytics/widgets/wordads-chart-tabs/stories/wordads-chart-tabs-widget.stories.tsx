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
import type { ChartDisplayChartType } from '@jetpack-premium-analytics/widgets-toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentProps, ComponentType } from 'react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

registerReportMocks();

const WORDADS_CHART_TABS_RENDER_MODULE = 'storybook/wordads-chart-tabs';

interface WordAdsChartTabsStoryControls extends SiteTimeZoneControls {
	chartType: ChartDisplayChartType;
}

const CHART_TYPE_ARG_TYPES = {
	chartType: {
		control: 'inline-radio',
		options: [ 'line', 'bar' ] satisfies ChartDisplayChartType[],
	},
} as const;

// Mirror the header controls' saved attributes. Each preset gets its own query-cache entry.
function renderOnPreset( preset: PresetType ) {
	return ( { chartType }: WordAdsChartTabsStoryControls ) => (
		<WordAdsChartTabsRender
			attributes={ { reportParams: getDefaultQueryParams( false, preset ), chartType } }
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
		...CHART_TYPE_ARG_TYPES,
	},
	args: {
		chartType: 'line',
	},
	parameters: {
		docs: {
			description: {
				component:
					"WordAds performance over the selected period as selectable metric tabs (Ads Served, Average CPM, and Revenue, matching the Calypso WordAds page's tabs) over a line or bar chart. Ads Served is a count; CPM and revenue are currency (WordAds pays USD). The widget hosts its own date range control in its header, saved onto the widget instance; the bucket size follows the selected window. The \"Chart type\" control is the `chartType` attribute (`relevance: 'high'`), exposed by the widget host; which metric is plotted is the chart's own tab selection. WordAds stats are computed nightly, so the last bucket of a range ending today stays empty until that run lands; only a range ending in the future is clamped back to today. Data comes from the `useStatsWordAdsStats` hook (the `wordads` proxy prefix); in Storybook it is served by `registerReportMocks`. Requires WordAds to be active on the site for live data.",
			},
		},
	},
} satisfies Meta< ComponentProps< typeof WordAdsChartTabsRender > & WordAdsChartTabsStoryControls >;

export default meta;

type Story = StoryObj< WordAdsChartTabsStoryControls >;
type DashboardStory = StoryObj< WidgetDashboardWithWidgetControls & WordAdsChartTabsStoryControls >;

/**
 * The widget on its own, on the range its header control defaults to.
 */
export const Default: Story = {
	render: renderOnPreset( 'last-30-days' ),
	decorators: [ withWidgetCanvas ],
};

/**
 * The same window drawn as bars, as the header's Chart type control saves it.
 */
export const BarChart: Story = {
	render: renderOnPreset( 'last-30-days' ),
	args: { chartType: 'bar' },
	decorators: [ withWidgetCanvas ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: renderOnPreset( 'last-90-days' ),
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
	render: renderOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'wordads/stats', 'error' );
		return () => setReportMockState( 'wordads/stats', null );
	},
};

/**
 * Resolved with no rows: the widget shows the generic empty state (the magnifier
 * glyph and "We couldn’t find results for this time period.").
 */
export const Empty: Story = {
	render: renderOnPreset( 'last-365-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'wordads/stats', 'empty' );
		return () => setReportMockState( 'wordads/stats', null );
	},
};

function WordAdsChartTabsDashboardStory( {
	chartType,
	...dashboardArgs
}: WidgetDashboardWithWidgetControls & WordAdsChartTabsStoryControls ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ createStoryWidgetType( widgetManifest, widgetDefinition ) }
			renderModule={ WORDADS_CHART_TABS_RENDER_MODULE }
			renderComponent={ WordAdsChartTabsRender as ComponentType< WidgetRenderProps< unknown > > }
			// The real header controls edit these attributes; the harness renders the
			// widget's declared header, so the story starts them where the app does.
			attributes={ { reportParams: getDefaultQueryParams( false ), chartType } }
		/>
	);
}

/**
 * Renders the real registered widget through the shared dashboard harness,
 * including the date range and chart type controls the widget declares in its
 * own header.
 */
export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <WordAdsChartTabsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		chartType: 'line',
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		...CHART_TYPE_ARG_TYPES,
	},
};
