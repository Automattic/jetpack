import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import AverageOrderValueRender from '../render';
import widgetDefinition from '../widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType } from 'react';

registerReportMocks();

const AVERAGE_ORDER_VALUE_RENDER_MODULE = 'storybook/average-order-value';

interface AverageOrderValueDashboardStoryProps extends WidgetDashboardWithWidgetControls {
	withComparison: boolean;
}

function AverageOrderValueDashboardStory( {
	withComparison,
	...dashboardStoryArgs
}: AverageOrderValueDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ AVERAGE_ORDER_VALUE_RENDER_MODULE }
			renderComponent={ AverageOrderValueRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ {
				reportParams: getDefaultQueryParams( withComparison ),
			} }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/AverageOrderValue',
	component: AverageOrderValueDashboardStory,
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
					'Dashboard widget that displays the average order value with an optional comparison period and sparkline.',
			},
		},
	},
} satisfies Meta< typeof AverageOrderValueDashboardStory >;

export default meta;

type Story = StoryObj< typeof meta >;

export const WidgetDashboardWithWidget: Story = {};
