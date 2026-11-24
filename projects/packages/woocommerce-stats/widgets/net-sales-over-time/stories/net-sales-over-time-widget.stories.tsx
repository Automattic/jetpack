import { expect } from 'storybook/test';
import {
	createStoryWidgetType,
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	forceWooReportState,
	registerWooReportMocks,
	storyReportParams,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	withinWidgetCanvas,
	withWidgetCanvas,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/shared';
import NetSalesOverTimeRender from '../render';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerWooReportMocks();

const NET_SALES_OVER_TIME_RENDER_MODULE = 'storybook/net-sales-over-time';
const ORDERS_REPORT_PATH = 'analytics/reports/orders/by-date';

const storyWidgetType = createStoryWidgetType( widgetManifest );

interface NetSalesOverTimeStoryControls {
	withComparison: boolean;
	chartType: 'line' | 'bar';
}

interface NetSalesOverTimeDashboardStoryProps
	extends WidgetDashboardWithWidgetControls, NetSalesOverTimeStoryControls {}

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
function renderNetSalesOverTimeWidget( {
	withComparison,
	chartType,
}: NetSalesOverTimeStoryControls ) {
	return (
		<NetSalesOverTimeRender
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
function NetSalesOverTimeDashboardStory( {
	withComparison,
	chartType,
	...dashboardArgs
}: NetSalesOverTimeDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ NET_SALES_OVER_TIME_RENDER_MODULE }
			renderComponent={ NetSalesOverTimeRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: storyReportParams( { withComparison } ), chartType } }
		/>
	);
}

const meta = {
	title: 'Packages/WooCommerce Stats/Widgets/NetSalesOverTime',
	component: NetSalesOverTimeRender,
	tags: [ 'autodocs' ],
	argTypes: storyControlArgTypes,
	parameters: {
		docs: {
			description: {
				component:
					'The "Net sales over time" widget. Charts total revenue after discounts, returns and adjustments per interval from the store orders report, with an optional previous-period comparison.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof NetSalesOverTimeRender > & NetSalesOverTimeStoryControls >;

export default meta;

type Story = StoryObj< NetSalesOverTimeStoryControls >;
type DashboardStory = StoryObj< NetSalesOverTimeDashboardStoryProps >;

export const Default: Story = {
	render: renderNetSalesOverTimeWidget,
	args: { withComparison: false, chartType: 'line' },
	decorators: [ withWidgetCanvas ],
	play: async ( { canvasElement } ) => {
		const canvas = withinWidgetCanvas( canvasElement );

		await expect( await canvas.findByText( '$76,657.87' ) ).toBeVisible();
	},
};

export const WithComparison: Story = {
	render: renderNetSalesOverTimeWidget,
	args: { withComparison: true, chartType: 'line' },
	decorators: [ withWidgetCanvas ],
};

export const Loading: Story = {
	render: renderNetSalesOverTimeWidget,
	args: { withComparison: false, chartType: 'line' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( ORDERS_REPORT_PATH, 'loading' ),
};

export const Empty: Story = {
	render: renderNetSalesOverTimeWidget,
	args: { withComparison: false, chartType: 'line' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( ORDERS_REPORT_PATH, 'empty' ),
};

export const ErrorState: Story = {
	render: renderNetSalesOverTimeWidget,
	args: { withComparison: false, chartType: 'line' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( ORDERS_REPORT_PATH, 'error' ),
};

export const ErrorRetryable: Story = {
	render: renderNetSalesOverTimeWidget,
	args: { withComparison: false, chartType: 'line' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( ORDERS_REPORT_PATH, 'error-retryable' ),
};

export const WidgetDashboardWithWidget: DashboardStory = {
	tags: [ 'widget-dashboard' ],
	render: args => <NetSalesOverTimeDashboardStory { ...args } />,
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
