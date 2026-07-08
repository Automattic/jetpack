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
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const SUBSCRIBERS_CHART_RENDER_MODULE = 'storybook/subscribers-chart';

interface SubscribersChartStoryControls {
	withComparison: boolean;
}

function renderSubscribersChart( { withComparison }: SubscribersChartStoryControls ) {
	return (
		<SubscribersChartRender
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
	title: 'Packages/Premium Analytics/Widgets/SubscribersChart',
	component: SubscribersChartRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
	},
	parameters: {
		docs: {
			description: {
				component:
					'Subscriber growth over time. The date range and previous-period comparison follow the dashboard picker; the "Group by" control is the `granularity` attribute (`relevance: \'high\'`), exposed by the widget host, and chooses the bucket size (day/week/month) within that range. When comparison is on, the previous period is overlaid as a same-colour dashed line and the headline shows the period-over-period delta. Paid subscribers render as a second line when present. Data comes from `useStatsSubscribersReport`; in Storybook it is served by `registerReportMocks`.',
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
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

/**
 * Same close-up with the dashboard comparison range applied, so the previous
 * period is overlaid as a dashed line and the headline shows the delta.
 */
export const WithComparison: Story = {
	render: renderSubscribersChart,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
};

interface SubscribersChartDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		SubscribersChartStoryControls {}

function SubscribersChartDashboardStory( {
	withComparison,
	...dashboardArgs
}: SubscribersChartDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ widgetDefinition }
			renderModule={ SUBSCRIBERS_CHART_RENDER_MODULE }
			renderComponent={ SubscribersChartRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( withComparison ) } }
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
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
	},
};
