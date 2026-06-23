import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import BookingsOverTimeRender from '../render';
import widgetDefinition from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentType } from 'react';

registerReportMocks();

const BOOKINGS_OVER_TIME_RENDER_MODULE = 'storybook/bookings-over-time';

interface BookingsOverTimeDashboardStoryProps extends WidgetDashboardWithWidgetControls {
	withComparison: boolean;
}

/**
 *
 * @param root0
 * @param root0.withComparison
 */
/**
 * Renders the Bookings over time widget inside the dashboard story host.
 *
 * @param props                - Dashboard story controls.
 * @param props.withComparison - Whether report mocks include comparison data.
 * @return Dashboard story with the Bookings over time widget.
 */
function BookingsOverTimeDashboardStory( props: BookingsOverTimeDashboardStoryProps ) {
	const { withComparison, ...dashboardStoryArgs } = props;

	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ BOOKINGS_OVER_TIME_RENDER_MODULE }
			renderComponent={ BookingsOverTimeRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ {
				reportParams: getDefaultQueryParams( withComparison ),
			} }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/BookingsOverTime',
	component: BookingsOverTimeDashboardStory,
	tags: [ 'autodocs' ],
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: {
			control: 'boolean',
		},
	},
	parameters: {
		docs: {
			description: {
				component:
					'Dashboard widget that displays bookings over time with an optional comparison period and sparkline.',
			},
		},
	},
} satisfies Meta< typeof BookingsOverTimeDashboardStory >;

export default meta;

type Story = StoryObj< typeof meta >;

export const WidgetDashboardWithWidget: Story = {};
