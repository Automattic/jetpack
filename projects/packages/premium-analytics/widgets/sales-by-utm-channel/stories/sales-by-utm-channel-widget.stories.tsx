import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import SalesByUtmChannelRender from '../render';
import widgetDefinition from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentType } from 'react';

registerReportMocks();

const SALES_BY_UTM_CHANNEL_RENDER_MODULE = 'storybook/sales-by-utm-channel';

interface SalesByUtmChannelDashboardStoryProps extends WidgetDashboardWithWidgetControls {
	withComparison: boolean;
}

/**
 * Renders the Sales by UTM channel widget inside the dashboard story frame.
 *
 * @param root0                - Story args.
 * @param root0.withComparison - Whether to use comparison report params.
 * @return The rendered dashboard story.
 */
function SalesByUtmChannelDashboardStory( {
	withComparison,
	...dashboardStoryArgs
}: SalesByUtmChannelDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ SALES_BY_UTM_CHANNEL_RENDER_MODULE }
			renderComponent={ SalesByUtmChannelRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ {
				reportParams: getDefaultQueryParams( withComparison ),
			} }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/SalesByUtmChannel',
	component: SalesByUtmChannelDashboardStory,
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
					'Dashboard widget that displays top UTM channels by order revenue for the selected period.',
			},
		},
	},
} satisfies Meta< typeof SalesByUtmChannelDashboardStory >;

export default meta;

type Story = StoryObj< typeof meta >;

export const WidgetDashboardWithWidget: Story = {};
