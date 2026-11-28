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
import BookingsByDeviceRender from '../render';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerWooReportMocks();

const BOOKINGS_BY_DEVICE_RENDER_MODULE = 'storybook/bookings-by-device';
const ATTRIBUTION_REPORT_PATH = 'analytics/reports/order-attribution-by-product/device/summary';

const storyWidgetType = createStoryWidgetType( widgetManifest );

interface BookingsByDeviceStoryControls {
	withComparison: boolean;
}

interface BookingsByDeviceDashboardStoryProps
	extends WidgetDashboardWithWidgetControls, BookingsByDeviceStoryControls {}

const storyControlArgTypes = {
	withComparison: {
		control: 'boolean',
		description: 'Include previous-period comparison report params.',
	},
} as const;

/**
 * Renders the widget close-up with the story controls as its attributes.
 *
 * @param controls                - The story controls.
 * @param controls.withComparison - Whether the report params carry a comparison window.
 * @return The widget.
 */
function renderBookingsByDeviceWidget( { withComparison }: BookingsByDeviceStoryControls ) {
	return (
		<BookingsByDeviceRender
			attributes={ { reportParams: storyReportParams( { withComparison } ) } }
		/>
	);
}

/**
 * Mounts the real widget dashboard around the widget, with the story controls as its attributes.
 *
 * @param props                - The dashboard controls plus the story controls.
 * @param props.withComparison - Whether the report params carry a comparison window.
 * @return The dashboard.
 */
function BookingsByDeviceDashboardStory( {
	withComparison,
	...dashboardArgs
}: BookingsByDeviceDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ BOOKINGS_BY_DEVICE_RENDER_MODULE }
			renderComponent={ BookingsByDeviceRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: storyReportParams( { withComparison } ) } }
		/>
	);
}

const meta = {
	title: 'Packages/WooCommerce Stats/Widgets/BookingsByDevice',
	component: BookingsByDeviceRender,
	tags: [ 'autodocs' ],
	argTypes: storyControlArgTypes,
	parameters: {
		docs: {
			description: {
				component:
					'The "Bookings by device" widget. Splits the net sales of bookings by the device the order came from, as one column each, with an optional previous-period column beside it. The bookings filter routes it to the by-product report, which answers one period per request.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof BookingsByDeviceRender > & BookingsByDeviceStoryControls >;

export default meta;

type Story = StoryObj< BookingsByDeviceStoryControls >;
type DashboardStory = StoryObj< BookingsByDeviceDashboardStoryProps >;

/** The report includes orders with no recorded device, which the chart labels "Unassigned". */
export const Default: Story = {
	render: renderBookingsByDeviceWidget,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
	play: async ( { canvasElement } ) => {
		const canvas = withinWidgetCanvas( canvasElement );

		await expect( await canvas.findByText( 'Mobile' ) ).toBeVisible();
		await expect( await canvas.findByText( 'Unassigned' ) ).toBeVisible();
	},
};

export const WithComparison: Story = {
	render: renderBookingsByDeviceWidget,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
};

export const Loading: Story = {
	render: renderBookingsByDeviceWidget,
	args: { withComparison: false },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( ATTRIBUTION_REPORT_PATH, 'loading' ),
};

export const Empty: Story = {
	render: renderBookingsByDeviceWidget,
	args: { withComparison: false },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( ATTRIBUTION_REPORT_PATH, 'empty' ),
};

export const ErrorState: Story = {
	render: renderBookingsByDeviceWidget,
	args: { withComparison: false },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( ATTRIBUTION_REPORT_PATH, 'error' ),
};

export const ErrorRetryable: Story = {
	render: renderBookingsByDeviceWidget,
	args: { withComparison: false },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( ATTRIBUTION_REPORT_PATH, 'error-retryable' ),
};

export const WidgetDashboardWithWidget: DashboardStory = {
	tags: [ 'widget-dashboard' ],
	render: args => <BookingsByDeviceDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		...storyControlArgTypes,
	},
};
