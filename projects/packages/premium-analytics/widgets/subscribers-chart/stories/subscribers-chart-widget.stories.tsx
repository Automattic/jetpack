/**
 * External dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import SubscribersChartRender from '../render';
import widgetDefinition, {
	DEFAULT_SUBSCRIBERS_CHART_METRICS,
	type SubscribersChartMetricId,
} from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps, WidgetType } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const SUBSCRIBERS_CHART_RENDER_MODULE = 'storybook/subscribers-chart';

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

interface SubscribersChartStoryControls {
	withComparison: boolean;
	metrics: SubscribersChartMetricId[];
}

const METRIC_ARG_TYPES = {
	metrics: {
		control: 'check',
		options: DEFAULT_SUBSCRIBERS_CHART_METRICS,
	},
} as const;

const ALL_METRICS_ARGS = {
	metrics: DEFAULT_SUBSCRIBERS_CHART_METRICS,
} as const;

function renderSubscribersChart( { withComparison, metrics }: SubscribersChartStoryControls ) {
	return (
		<SubscribersChartRender
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
	title: 'Packages/Premium Analytics/Widgets/SubscribersChart',
	component: SubscribersChartRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
		...METRIC_ARG_TYPES,
	},
	parameters: {
		docs: {
			description: {
				component:
					'Subscriber growth over time. The date range and previous-period comparison follow the dashboard picker; the "Group by" control is the `granularity` attribute and the tab selection is the `metrics` attribute (both `relevance: \'high\'`), exposed by the widget host. When comparison is on, the previous period is overlaid as a same-colour dashed line and the headline shows the period-over-period delta. The Paid subscribers tab renders only when the site has paid subscribers, even while selected. Data comes from `useStatsSubscribersReport`; in Storybook it is served by `registerReportMocks`.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof SubscribersChartRender > & SubscribersChartStoryControls >;

export default meta;

type Story = StoryObj< SubscribersChartStoryControls >;

/**
 * The widget on its own, current period only.
 */
export const Default: Story = {
	render: renderSubscribersChart,
	args: { withComparison: false, ...ALL_METRICS_ARGS },
	decorators: [ withWidgetCanvas ],
};

/**
 * Same close-up with the dashboard comparison range applied, so the previous
 * period is overlaid as a dashed line and the headline shows the delta.
 */
export const WithComparison: Story = {
	render: renderSubscribersChart,
	args: { withComparison: true, ...ALL_METRICS_ARGS },
	decorators: [ withWidgetCanvas ],
};

interface SubscribersChartDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		SubscribersChartStoryControls {}

function SubscribersChartDashboardStory( {
	withComparison,
	metrics,
	...dashboardArgs
}: SubscribersChartDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ SUBSCRIBERS_CHART_RENDER_MODULE }
			renderComponent={ SubscribersChartRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( withComparison ), metrics } }
		/>
	);
}

/**
 * Renders the real registered widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: StoryObj< SubscribersChartDashboardStoryProps > = {
	render: args => <SubscribersChartDashboardStory { ...args } />,
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
