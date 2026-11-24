import { expect, waitFor, within } from 'storybook/test';
import {
	createStoryWidgetType,
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	forceWooReportState,
	registerWooReportMocks,
	storyReportParams,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	withinWidgetCanvas,
	withStoryRouter,
	withWidgetCanvas,
	WOO_REPORT_PATHS,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/shared';
import TopPerformingBookingsRender from '../render';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerWooReportMocks();

const TOP_PERFORMING_BOOKINGS_RENDER_MODULE = 'storybook/top-performing-bookings';
const storyWidgetType = createStoryWidgetType( widgetManifest );

interface TopPerformingBookingsStoryControls {
	withComparison: boolean;
}

interface TopPerformingBookingsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls, TopPerformingBookingsStoryControls {}

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
function renderTopPerformingBookingsWidget( {
	withComparison,
}: TopPerformingBookingsStoryControls ) {
	return (
		<TopPerformingBookingsRender
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
function TopPerformingBookingsDashboardStory( {
	withComparison,
	...dashboardArgs
}: TopPerformingBookingsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ TOP_PERFORMING_BOOKINGS_RENDER_MODULE }
			renderComponent={
				TopPerformingBookingsRender as ComponentType< WidgetRenderProps< unknown > >
			}
			attributes={ { reportParams: storyReportParams( { withComparison } ) } }
		/>
	);
}

const meta = {
	title: 'Packages/WooCommerce Stats/Widgets/TopPerformingBookings',
	component: TopPerformingBookingsRender,
	tags: [ 'autodocs' ],
	argTypes: storyControlArgTypes,
	parameters: {
		docs: {
			description: {
				component:
					'The "Top performing bookings" widget. Ranks the top bookable products of the period by net revenue, with thumbnails and links to each product, and an optional previous-period comparison.',
			},
		},
	},
} satisfies Meta<
	ComponentProps< typeof TopPerformingBookingsRender > & TopPerformingBookingsStoryControls
>;

export default meta;

type Story = StoryObj< TopPerformingBookingsStoryControls >;
type DashboardStory = StoryObj< TopPerformingBookingsDashboardStoryProps >;

/**
 * The details mock answers one product fewer than the report ranks, so one row has no
 * thumbnail and no link, as a product the store deleted does.
 */
export const Default: Story = {
	render: renderTopPerformingBookingsWidget,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas, withStoryRouter ],
	play: async ( { canvasElement } ) => {
		const canvas = withinWidgetCanvas( canvasElement );

		await canvas.findByText( 'Sourdough Baking Workshop' );
		await canvas.findByText( 'Saturday Pottery Class' );
		await canvas.findByText( 'Private Tasting Session' );
		expect( canvas.queryByText( 'Cast Iron Skillet' ) ).toBeNull();

		await waitFor( () =>
			expect(
				canvas
					.getAllByRole( 'listitem' )
					.filter( row => within( row ).queryAllByRole( 'link' ).length === 0 )
			).toHaveLength( 1 )
		);
	},
};

export const WithComparison: Story = {
	render: renderTopPerformingBookingsWidget,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas, withStoryRouter ],
};

export const Loading: Story = {
	render: renderTopPerformingBookingsWidget,
	args: { withComparison: false },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( WOO_REPORT_PATHS.products, 'loading' ),
};

export const Empty: Story = {
	render: renderTopPerformingBookingsWidget,
	args: { withComparison: false },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( WOO_REPORT_PATHS.products, 'empty' ),
};

export const ErrorState: Story = {
	render: renderTopPerformingBookingsWidget,
	args: { withComparison: false },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( WOO_REPORT_PATHS.products, 'error' ),
};

export const ErrorRetryable: Story = {
	render: renderTopPerformingBookingsWidget,
	args: { withComparison: false },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( WOO_REPORT_PATHS.products, 'error-retryable' ),
};

export const WidgetDashboardWithWidget: DashboardStory = {
	tags: [ 'widget-dashboard' ],
	render: args => <TopPerformingBookingsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		...storyControlArgTypes,
	},
};
