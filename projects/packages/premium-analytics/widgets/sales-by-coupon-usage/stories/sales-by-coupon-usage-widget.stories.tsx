import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import SalesByCouponUsageRender from '../render';
import widgetDefinition from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentType } from 'react';

registerReportMocks();

const SALES_BY_COUPON_USAGE_RENDER_MODULE = 'storybook/sales-by-coupon-usage';

interface SalesByCouponUsageDashboardStoryProps extends WidgetDashboardWithWidgetControls {
	withComparison: boolean;
}

function SalesByCouponUsageDashboardStory( {
	withComparison,
	...dashboardStoryArgs
}: SalesByCouponUsageDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ SALES_BY_COUPON_USAGE_RENDER_MODULE }
			renderComponent={ SalesByCouponUsageRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ {
				reportParams: getDefaultQueryParams( withComparison ),
			} }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/SalesByCouponUsage',
	component: SalesByCouponUsageDashboardStory,
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
					'Dashboard widget that displays the coupon sales breakdown for the selected period.',
			},
		},
	},
} satisfies Meta< typeof SalesByCouponUsageDashboardStory >;

export default meta;

type Story = StoryObj< typeof meta >;

export const WidgetDashboardWithWidget: Story = {};
