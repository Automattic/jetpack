/**
 * Internal dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import WordAdsChartTabsRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const WORDADS_CHART_TABS_RENDER_MODULE = 'storybook/wordads-chart-tabs';

interface WordAdsChartTabsStoryControls {
	withComparison: boolean;
}

function renderWordAdsChartTabs( { withComparison }: WordAdsChartTabsStoryControls ) {
	return (
		<WordAdsChartTabsRender
			attributes={ { reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

// Close-up canvas so the chart fills the frame outside the dashboard grid.
const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '360px' } }>
		<Story />
	</div>
);

const meta = {
	title: 'Packages/Premium Analytics/Widgets/WordAdsChartTabs',
	component: WordAdsChartTabsRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
	},
	parameters: {
		docs: {
			description: {
				component:
					'WordAds performance over the selected period as selectable metric tabs — Impressions, Revenue, and Avg. CPM — over a comparative line chart. Impressions is a count; revenue and CPM are currency. The date range and comparison come from the dashboard controls; the "Group by" control is the `granularity` attribute (`relevance: \'high\'`), exposed by the widget host, and chooses the bucket size within that range. When comparison is on the previous period is overlaid as a same-colour dashed line and each tab shows its period-over-period delta. Data comes from the `useStatsWordAdsStats` hook (the `wordads` proxy prefix); in Storybook it is served by `registerReportMocks`. Requires WordAds to be active on the site for live data.',
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
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

/**
 * Same close-up with the period-over-period delta and previous-period overlay.
 */
export const WithComparison: Story = {
	render: renderWordAdsChartTabs,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
};

interface WordAdsChartTabsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		WordAdsChartTabsStoryControls {}

function WordAdsChartTabsDashboardStory( {
	withComparison,
	...dashboardArgs
}: WordAdsChartTabsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ widgetDefinition }
			renderModule={ WORDADS_CHART_TABS_RENDER_MODULE }
			renderComponent={ WordAdsChartTabsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( withComparison ) } }
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
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
	},
};
