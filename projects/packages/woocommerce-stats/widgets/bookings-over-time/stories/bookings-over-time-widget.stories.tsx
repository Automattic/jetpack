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
import BookingsOverTimeRender from '../render';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerWooReportMocks();

const BOOKINGS_OVER_TIME_RENDER_MODULE = 'storybook/bookings-over-time';
const BOOKINGS_REPORT_PATH = 'analytics/reports/orders-by-product-type/by-date';

const storyWidgetType = createStoryWidgetType( widgetManifest );

interface BookingsOverTimeStoryControls {
	withComparison: boolean;
	chartType: 'line' | 'bar';
}

interface BookingsOverTimeDashboardStoryProps
	extends WidgetDashboardWithWidgetControls, BookingsOverTimeStoryControls {}

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
function renderBookingsOverTimeWidget( {
	withComparison,
	chartType,
}: BookingsOverTimeStoryControls ) {
	return (
		<BookingsOverTimeRender
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
function BookingsOverTimeDashboardStory( {
	withComparison,
	chartType,
	...dashboardArgs
}: BookingsOverTimeDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ BOOKINGS_OVER_TIME_RENDER_MODULE }
			renderComponent={ BookingsOverTimeRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: storyReportParams( { withComparison } ), chartType } }
		/>
	);
}

const meta = {
	title: 'Packages/WooCommerce Stats/Widgets/BookingsOverTime',
	component: BookingsOverTimeRender,
	tags: [ 'autodocs' ],
	argTypes: storyControlArgTypes,
	parameters: {
		docs: {
			description: {
				component:
					'The "Bookings over time" widget. Charts the number of bookings placed per interval from the store orders report filtered to bookings, to show peak selling periods, with an optional previous-period comparison.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof BookingsOverTimeRender > & BookingsOverTimeStoryControls >;

export default meta;

type Story = StoryObj< BookingsOverTimeStoryControls >;
type DashboardStory = StoryObj< BookingsOverTimeDashboardStoryProps >;

export const Default: Story = {
	render: renderBookingsOverTimeWidget,
	args: { withComparison: false, chartType: 'line' },
	decorators: [ withWidgetCanvas ],
	play: async ( { canvasElement } ) => {
		const canvas = withinWidgetCanvas( canvasElement );

		await expect( await canvas.findByText( '616' ) ).toBeVisible();
	},
};

export const WithComparison: Story = {
	render: renderBookingsOverTimeWidget,
	args: { withComparison: true, chartType: 'line' },
	decorators: [ withWidgetCanvas ],
};

export const Loading: Story = {
	render: renderBookingsOverTimeWidget,
	args: { withComparison: false, chartType: 'line' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( BOOKINGS_REPORT_PATH, 'loading' ),
};

export const Empty: Story = {
	render: renderBookingsOverTimeWidget,
	args: { withComparison: false, chartType: 'line' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( BOOKINGS_REPORT_PATH, 'empty' ),
};

export const ErrorState: Story = {
	render: renderBookingsOverTimeWidget,
	args: { withComparison: false, chartType: 'line' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( BOOKINGS_REPORT_PATH, 'error' ),
};

export const ErrorRetryable: Story = {
	render: renderBookingsOverTimeWidget,
	args: { withComparison: false, chartType: 'line' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( BOOKINGS_REPORT_PATH, 'error-retryable' ),
};

export const WidgetDashboardWithWidget: DashboardStory = {
	tags: [ 'widget-dashboard' ],
	render: args => <BookingsOverTimeDashboardStory { ...args } />,
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
