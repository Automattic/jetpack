import { expect, within } from 'storybook/test';
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
import GrossSalesOverTimeRender from '../render';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerWooReportMocks();

const GROSS_SALES_OVER_TIME_RENDER_MODULE = 'storybook/gross-sales-over-time';
const ORDERS_REPORT_PATH = 'analytics/reports/orders/by-date';

const storyWidgetType = createStoryWidgetType( widgetManifest );

interface GrossSalesOverTimeStoryControls {
	withComparison: boolean;
	chartType: 'line' | 'bar';
}

interface GrossSalesOverTimeDashboardStoryProps
	extends WidgetDashboardWithWidgetControls, GrossSalesOverTimeStoryControls {}

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
function renderGrossSalesOverTimeWidget( {
	withComparison,
	chartType,
}: GrossSalesOverTimeStoryControls ) {
	return (
		<GrossSalesOverTimeRender
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
function GrossSalesOverTimeDashboardStory( {
	withComparison,
	chartType,
	...dashboardArgs
}: GrossSalesOverTimeDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ GROSS_SALES_OVER_TIME_RENDER_MODULE }
			renderComponent={ GrossSalesOverTimeRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: storyReportParams( { withComparison } ), chartType } }
		/>
	);
}

const meta = {
	title: 'Packages/WooCommerce Stats/Widgets/GrossSalesOverTime',
	component: GrossSalesOverTimeRender,
	tags: [ 'autodocs' ],
	argTypes: storyControlArgTypes,
	parameters: {
		docs: {
			description: {
				component:
					'The "Gross sales over time" widget. Charts gross sales per interval from the store orders report, with an optional previous-period comparison.',
			},
		},
	},
} satisfies Meta<
	ComponentProps< typeof GrossSalesOverTimeRender > & GrossSalesOverTimeStoryControls
>;

export default meta;

type Story = StoryObj< GrossSalesOverTimeStoryControls >;
type DashboardStory = StoryObj< GrossSalesOverTimeDashboardStoryProps >;

export const Default: Story = {
	render: renderGrossSalesOverTimeWidget,
	args: { withComparison: false, chartType: 'line' },
	decorators: [ withWidgetCanvas ],
	play: async ( { canvasElement } ) => {
		const canvas = within( canvasElement );

		await expect( await canvas.findByText( '$82,427.81' ) ).toBeVisible();
	},
};

export const WithComparison: Story = {
	render: renderGrossSalesOverTimeWidget,
	args: { withComparison: true, chartType: 'line' },
	decorators: [ withWidgetCanvas ],
};

export const Loading: Story = {
	render: renderGrossSalesOverTimeWidget,
	args: { withComparison: false, chartType: 'line' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( ORDERS_REPORT_PATH, 'loading' ),
};

export const Empty: Story = {
	render: renderGrossSalesOverTimeWidget,
	args: { withComparison: false, chartType: 'line' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( ORDERS_REPORT_PATH, 'empty' ),
};

export const ErrorState: Story = {
	render: renderGrossSalesOverTimeWidget,
	args: { withComparison: false, chartType: 'line' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( ORDERS_REPORT_PATH, 'error' ),
};

export const ErrorRetryable: Story = {
	render: renderGrossSalesOverTimeWidget,
	args: { withComparison: false, chartType: 'line' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( ORDERS_REPORT_PATH, 'error-retryable' ),
};

export const WidgetDashboardWithWidget: DashboardStory = {
	tags: [ 'widget-dashboard' ],
	render: args => <GrossSalesOverTimeDashboardStory { ...args } />,
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
