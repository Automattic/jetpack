import {
	createStoryWidgetType,
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	forceWooReportState,
	registerWooReportMocks,
	storyReportParams,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	withWidgetCanvas,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/shared';
import OrdersOverTimeRender from '../render';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerWooReportMocks();

const ORDERS_OVER_TIME_RENDER_MODULE = 'storybook/orders-over-time';
const ORDERS_REPORT_PATH = 'analytics/reports/orders/by-date';

const storyWidgetType = createStoryWidgetType( widgetManifest );

interface OrdersOverTimeStoryControls {
	withComparison: boolean;
	chartType: 'line' | 'bar';
}

interface OrdersOverTimeDashboardStoryProps
	extends WidgetDashboardWithWidgetControls, OrdersOverTimeStoryControls {}

const storyControlArgTypes = {
	withComparison: {
		control: 'boolean',
		description: 'Include previous-period comparison report params.',
	},
	chartType: {
		control: 'inline-radio',
		options: [ 'line', 'bar' ],
		description: 'How the series is drawn.',
	},
} as const;

/**
 * Renders the widget close-up with the story controls as its attributes.
 *
 * @param controls                - The story controls.
 * @param controls.withComparison - Whether the report params carry a comparison window.
 * @param controls.chartType      - How the series is drawn.
 * @return The widget.
 */
function renderOrdersOverTimeWidget( { withComparison, chartType }: OrdersOverTimeStoryControls ) {
	return (
		<OrdersOverTimeRender
			attributes={ { reportParams: storyReportParams( { withComparison } ), chartType } }
		/>
	);
}

/**
 * Mounts the real widget dashboard around the widget, with the story controls as its attributes.
 *
 * @param props                - The dashboard controls plus the story controls.
 * @param props.withComparison - Whether the report params carry a comparison window.
 * @param props.chartType      - How the series is drawn.
 * @return The dashboard.
 */
function OrdersOverTimeDashboardStory( {
	withComparison,
	chartType,
	...dashboardArgs
}: OrdersOverTimeDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ ORDERS_OVER_TIME_RENDER_MODULE }
			renderComponent={ OrdersOverTimeRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: storyReportParams( { withComparison } ), chartType } }
		/>
	);
}

const meta = {
	title: 'Packages/WooCommerce Stats/Widgets/OrdersOverTime',
	component: OrdersOverTimeRender,
	tags: [ 'autodocs' ],
	argTypes: storyControlArgTypes,
	parameters: {
		docs: {
			description: {
				component:
					'The "Orders over time" widget. Charts the number of orders placed per interval from the store orders report, to show peak selling periods, with an optional previous-period comparison.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof OrdersOverTimeRender > & OrdersOverTimeStoryControls >;

export default meta;

type Story = StoryObj< OrdersOverTimeStoryControls >;
type DashboardStory = StoryObj< OrdersOverTimeDashboardStoryProps >;

export const Default: Story = {
	render: renderOrdersOverTimeWidget,
	args: { withComparison: false, chartType: 'line' },
	decorators: [ withWidgetCanvas ],
};

export const WithComparison: Story = {
	render: renderOrdersOverTimeWidget,
	args: { withComparison: true, chartType: 'line' },
	decorators: [ withWidgetCanvas ],
};

export const Loading: Story = {
	render: renderOrdersOverTimeWidget,
	args: { withComparison: false, chartType: 'line' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( ORDERS_REPORT_PATH, 'loading' ),
};

export const Empty: Story = {
	render: renderOrdersOverTimeWidget,
	args: { withComparison: false, chartType: 'line' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( ORDERS_REPORT_PATH, 'empty' ),
};

export const ErrorState: Story = {
	render: renderOrdersOverTimeWidget,
	args: { withComparison: false, chartType: 'line' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( ORDERS_REPORT_PATH, 'error' ),
};

export const ErrorRetryable: Story = {
	render: renderOrdersOverTimeWidget,
	args: { withComparison: false, chartType: 'line' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( ORDERS_REPORT_PATH, 'error-retryable' ),
};

export const WidgetDashboardWithWidget: DashboardStory = {
	tags: [ 'widget-dashboard' ],
	render: args => <OrdersOverTimeDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
		chartType: 'line',
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		...storyControlArgTypes,
	},
};
