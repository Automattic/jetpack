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
import TrafficChartRender from '../render';
import widgetDefinition, {
	DEFAULT_TRAFFIC_CHART_METRICS,
	type TrafficChartMetricId,
} from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps, WidgetType } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const TRAFFIC_CHART_RENDER_MODULE = 'storybook/traffic-chart';

// Carry the widget's metadata, including the metric-visibility attribute schema
// so the dashboard story's settings drawer renders the real controls. The
// attribute schema is typed loosely on the widget definition, so it is cast to
// the WidgetType shape.
const storyWidgetType = {
	name: widgetDefinition.name,
	title: widgetDefinition.title,
	icon: widgetDefinition.icon,
	attributes: widgetDefinition.attributes as WidgetType[ 'attributes' ],
	example: widgetDefinition.example,
};

interface TrafficChartStoryControls {
	withComparison: boolean;
	metrics: TrafficChartMetricId[];
}

const METRIC_ARG_TYPES = {
	metrics: {
		control: 'check',
		options: DEFAULT_TRAFFIC_CHART_METRICS,
	},
} as const;

const ALL_METRICS_ARGS = {
	metrics: DEFAULT_TRAFFIC_CHART_METRICS,
} as const;

function renderTrafficChart( { withComparison, metrics }: TrafficChartStoryControls ) {
	return (
		<TrafficChartRender
			attributes={ { reportParams: getDefaultQueryParams( withComparison ), metrics } }
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
	title: 'Packages/Premium Analytics/Widgets/TrafficChart',
	component: TrafficChartRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
		...METRIC_ARG_TYPES,
	},
	parameters: {
		docs: {
			description: {
				component:
					"Traffic over the selected period as selectable metric tabs — Views, Visitors, Likes, and Comments — over a comparative line chart. The date range and comparison come from the dashboard controls; the \"Group by\" control is the `granularity` attribute and the tab selection is the `metrics` attribute (both `relevance: 'high'`), exposed by the widget host. When comparison is on the previous period is overlaid as a same-colour dashed line and each tab shows its period-over-period delta. Views/visitors and likes/comments are fetched as two parallel requests (mirroring Calypso) to keep latency down; a pair's request is skipped while neither of its metrics is selected. Data comes from the `useStatsVisits` hook; in Storybook it is served by `registerReportMocks`.",
			},
		},
	},
} satisfies Meta< ComponentProps< typeof TrafficChartRender > & TrafficChartStoryControls >;

export default meta;

type Story = StoryObj< TrafficChartStoryControls >;

/**
 * The widget on its own, current period only.
 */
export const Default: Story = {
	render: renderTrafficChart,
	args: { withComparison: false, ...ALL_METRICS_ARGS },
	decorators: [ withWidgetCanvas ],
};

/**
 * Same close-up with the period-over-period delta and previous-period overlay.
 */
export const WithComparison: Story = {
	render: renderTrafficChart,
	args: { withComparison: true, ...ALL_METRICS_ARGS },
	decorators: [ withWidgetCanvas ],
};

interface TrafficChartDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		TrafficChartStoryControls {}

function TrafficChartDashboardStory( {
	withComparison,
	metrics,
	...dashboardArgs
}: TrafficChartDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ TRAFFIC_CHART_RENDER_MODULE }
			renderComponent={ TrafficChartRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( withComparison ), metrics } }
		/>
	);
}

/**
 * Renders the real registered widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: StoryObj< TrafficChartDashboardStoryProps > = {
	render: args => <TrafficChartDashboardStory { ...args } />,
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
