import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import SalesByCouponRender from '../render';
import widgetDefinition from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@automattic/jetpack-widget-primitives';
import type { ComponentType } from 'react';

registerReportMocks();

const SALES_BY_COUPON_RENDER_MODULE = 'storybook/sales-by-coupon';

interface SalesByCouponDashboardStoryProps extends WidgetDashboardWithWidgetControls {
	withComparison: boolean;
}

function SalesByCouponDashboardStory( {
	withComparison,
	...dashboardStoryArgs
}: SalesByCouponDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ SALES_BY_COUPON_RENDER_MODULE }
			renderComponent={ SalesByCouponRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ {
				reportParams: getDefaultQueryParams( withComparison ),
			} }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/SalesByCoupon',
	component: SalesByCouponDashboardStory,
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
					'Dashboard widget that displays top coupon codes by order revenue for the selected period.',
			},
		},
	},
} satisfies Meta< typeof SalesByCouponDashboardStory >;

export default meta;

type Story = StoryObj< typeof meta >;

export const WidgetDashboardWithWidget: Story = {};
