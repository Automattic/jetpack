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
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const TRAFFIC_CHART_RENDER_MODULE = 'storybook/traffic-chart';

interface TrafficChartStoryControls {
	withComparison: boolean;
}

function renderTrafficChart( { withComparison }: TrafficChartStoryControls ) {
	return (
		<TrafficChartRender attributes={ { reportParams: getDefaultQueryParams( withComparison ) } } />
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
	},
	parameters: {
		docs: {
			description: {
				component:
					'Traffic over the selected period as selectable metric tabs — Views, Visitors, Likes, and Comments — over a comparative line chart. The date range and comparison come from the dashboard controls; the "Group by" control is the `granularity` attribute (`relevance: \'high\'`), exposed by the widget host, and chooses the bucket size within that range. When comparison is on the previous period is overlaid as a same-colour dashed line and each tab shows its period-over-period delta. Views/visitors and likes/comments are fetched as two parallel requests (mirroring Calypso) to keep latency down. Data comes from the `useStatsVisits` hook; in Storybook it is served by `registerReportMocks`.',
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
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

/**
 * Same close-up with the period-over-period delta and previous-period overlay.
 */
export const WithComparison: Story = {
	render: renderTrafficChart,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
};

interface TrafficChartDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		TrafficChartStoryControls {}

function TrafficChartDashboardStory( {
	withComparison,
	...dashboardArgs
}: TrafficChartDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ widgetDefinition }
			renderModule={ TRAFFIC_CHART_RENDER_MODULE }
			renderComponent={ TrafficChartRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( withComparison ) } }
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
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
	},
};
