/**
 * Internal dependencies
 */
import { getDefaultQueryParams, type PresetType } from '@jetpack-premium-analytics/data';
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
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import { DEFAULT_WORDADS_CHART_METRICS, type WordAdsChartMetricId } from '../metrics';
import WordAdsChartTabsRender from '../render';
import widgetDefinition from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const WORDADS_CHART_TABS_RENDER_MODULE = 'storybook/wordads-chart-tabs';

interface WordAdsChartTabsStoryControls {
	withComparison: boolean;
	/**
	 * WordAds metrics to show as selectable tabs.
	 */
	metrics: WordAdsChartMetricId[];
}

const METRIC_ARG_TYPES = {
	metrics: {
		control: 'check',
		options: DEFAULT_WORDADS_CHART_METRICS,
	},
} as const;

const ALL_METRICS_ARGS = {
	metrics: DEFAULT_WORDADS_CHART_METRICS,
} as const;

function renderWordAdsChartTabs( { withComparison, metrics }: WordAdsChartTabsStoryControls ) {
	return (
		<WordAdsChartTabsRender
			attributes={ { reportParams: getDefaultQueryParams( withComparison ), metrics } }
		/>
	);
}

// Distinct preset → own query-cache entry; see forceStatsMockState.
function renderWordAdsChartTabsOnPreset( preset: PresetType ) {
	return (
		<WordAdsChartTabsRender
			attributes={ { reportParams: getDefaultQueryParams( false, preset ) } }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/WordAdsChartTabs',
	component: WordAdsChartTabsRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
		...METRIC_ARG_TYPES,
	},
	parameters: {
		docs: {
			description: {
				component:
					"WordAds performance over the selected period as selectable metric tabs — Ads Served, Average CPM, and Revenue, matching the Calypso WordAds page's tabs — over a comparative line chart. Ads Served is a count; CPM and revenue are currency (WordAds pays USD). The date range and comparison come from the dashboard controls; the \"Group by\" control is the `granularity` attribute and the visible tabs are the `metrics` attribute (both `relevance: 'high'`), exposed by the widget host. WordAds stats are computed nightly, so a range ending today is clamped to end at yesterday. When comparison is on the previous period is overlaid as a same-colour dashed line and each tab shows its period-over-period delta. Data comes from the `useStatsWordAdsStats` hook (the `wordads` proxy prefix); in Storybook it is served by `registerReportMocks`. Requires WordAds to be active on the site for live data.",
			},
		},
	},
} satisfies Meta< ComponentProps< typeof WordAdsChartTabsRender > & WordAdsChartTabsStoryControls >;

export default meta;

type Story = StoryObj< WordAdsChartTabsStoryControls >;

/**
 * The widget on its own, current period only.
 */
export const Default: Story = {
	render: renderWordAdsChartTabs,
	args: { withComparison: false, ...ALL_METRICS_ARGS },
	decorators: [ withWidgetCanvas ],
};

/**
 * Same close-up with the period-over-period delta and previous-period overlay.
 */
export const WithComparison: Story = {
	render: renderWordAdsChartTabs,
	args: { withComparison: true, ...ALL_METRICS_ARGS },
	decorators: [ withWidgetCanvas ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: () => renderWordAdsChartTabsOnPreset( 'last-90-days' ),
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
	render: () => renderWordAdsChartTabsOnPreset( 'last-7-days' ),
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
	render: () => renderWordAdsChartTabsOnPreset( 'last-365-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'wordads/stats', 'empty' );
		return () => setReportMockState( 'wordads/stats', null );
	},
};

interface WordAdsChartTabsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		WordAdsChartTabsStoryControls {}

function WordAdsChartTabsDashboardStory( {
	withComparison,
	metrics,
	...dashboardArgs
}: WordAdsChartTabsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ widgetDefinition }
			renderModule={ WORDADS_CHART_TABS_RENDER_MODULE }
			renderComponent={ WordAdsChartTabsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( withComparison ), metrics } }
		/>
	);
}

/**
 * Renders the real registered widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: StoryObj< WordAdsChartTabsDashboardStoryProps > = {
	render: args => <WordAdsChartTabsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
		...ALL_METRICS_ARGS,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
		...METRIC_ARG_TYPES,
	},
};
