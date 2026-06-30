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
import type { ComponentType } from 'react';

registerReportMocks();

const SUBSCRIBERS_CHART_RENDER_MODULE = 'storybook/subscribers-chart';

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
	parameters: {
		docs: {
			description: {
				component:
					'Subscriber growth over time. The in-body "Group by" dropdown switches granularity (day/week/month); the previous period is overlaid as a same-colour dashed line and the headline shows the period-over-period delta. Paid subscribers render as a second line when present. Data comes from the designated `useStatsSubscribers` hook; in Storybook it is served by `registerReportMocks`.',
			},
		},
	},
} satisfies Meta< typeof SubscribersChartRender >;

export default meta;

type Story = StoryObj< typeof meta >;
type DashboardStory = StoryObj< WidgetDashboardWithWidgetControls >;

/**
 * The widget on its own, populated from mocked subscribers data. Shows both the
 * subscribers and paid-subscribers lines with their previous-period overlays.
 */
export const Default: Story = {
	render: () => <SubscribersChartRender attributes={ {} } />,
	decorators: [ withWidgetCanvas ],
};

/**
 * Renders the real registered widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => (
		<WidgetDashboardWithWidgetStory
			{ ...args }
			widgetType={ widgetDefinition }
			renderModule={ SUBSCRIBERS_CHART_RENDER_MODULE }
			renderComponent={ SubscribersChartRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ {} }
		/>
	),
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
	},
};
