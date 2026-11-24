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
	WOO_REPORT_PATHS,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/shared';
import AverageItemsPerOrderRender from '../render';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerWooReportMocks();

const AVERAGE_ITEMS_PER_ORDER_RENDER_MODULE = 'storybook/average-items-per-order';
const storyWidgetType = createStoryWidgetType( widgetManifest );

interface AverageItemsPerOrderStoryControls {
	withComparison: boolean;
	chartType: 'line' | 'bar';
}

interface AverageItemsPerOrderDashboardStoryProps
	extends WidgetDashboardWithWidgetControls, AverageItemsPerOrderStoryControls {}

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
function renderAverageItemsPerOrderWidget( {
	withComparison,
	chartType,
}: AverageItemsPerOrderStoryControls ) {
	return (
		<AverageItemsPerOrderRender
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
function AverageItemsPerOrderDashboardStory( {
	withComparison,
	chartType,
	...dashboardArgs
}: AverageItemsPerOrderDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ AVERAGE_ITEMS_PER_ORDER_RENDER_MODULE }
			renderComponent={
				AverageItemsPerOrderRender as ComponentType< WidgetRenderProps< unknown > >
			}
			attributes={ { reportParams: storyReportParams( { withComparison } ), chartType } }
		/>
	);
}

const meta = {
	title: 'Packages/WooCommerce Stats/Widgets/AverageItemsPerOrder',
	component: AverageItemsPerOrderRender,
	tags: [ 'autodocs' ],
	argTypes: storyControlArgTypes,
	parameters: {
		docs: {
			description: {
				component:
					'The "Average items per order" widget. Charts the average number of products per order for each interval from the store orders report, with an optional previous-period comparison.',
			},
		},
	},
} satisfies Meta<
	ComponentProps< typeof AverageItemsPerOrderRender > & AverageItemsPerOrderStoryControls
>;

export default meta;

type Story = StoryObj< AverageItemsPerOrderStoryControls >;
type DashboardStory = StoryObj< AverageItemsPerOrderDashboardStoryProps >;

export const Default: Story = {
	render: renderAverageItemsPerOrderWidget,
	args: { withComparison: false, chartType: 'line' },
	decorators: [ withWidgetCanvas ],
	play: async ( { canvasElement } ) => {
		const canvas = withinWidgetCanvas( canvasElement );

		await expect( await canvas.findByText( '2.30' ) ).toBeVisible();
	},
};

export const WithComparison: Story = {
	render: renderAverageItemsPerOrderWidget,
	args: { withComparison: true, chartType: 'line' },
	decorators: [ withWidgetCanvas ],
};

export const Loading: Story = {
	render: renderAverageItemsPerOrderWidget,
	args: { withComparison: false, chartType: 'line' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( WOO_REPORT_PATHS.ordersByDate, 'loading' ),
};

export const Empty: Story = {
	render: renderAverageItemsPerOrderWidget,
	args: { withComparison: false, chartType: 'line' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( WOO_REPORT_PATHS.ordersByDate, 'empty' ),
};

export const ErrorState: Story = {
	render: renderAverageItemsPerOrderWidget,
	args: { withComparison: false, chartType: 'line' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( WOO_REPORT_PATHS.ordersByDate, 'error' ),
};

export const ErrorRetryable: Story = {
	render: renderAverageItemsPerOrderWidget,
	args: { withComparison: false, chartType: 'line' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( WOO_REPORT_PATHS.ordersByDate, 'error-retryable' ),
};

export const WidgetDashboardWithWidget: DashboardStory = {
	tags: [ 'widget-dashboard' ],
	render: args => <AverageItemsPerOrderDashboardStory { ...args } />,
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
