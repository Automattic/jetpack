import { expect, waitFor, within } from 'storybook/test';
import {
	createStoryWidgetType,
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	forceWooReportState,
	registerWooReportMocks,
	storyReportParams,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	withStoryRouter,
	withWidgetCanvas,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/shared';
import TopPerformingProductsRender from '../render';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerWooReportMocks();

const TOP_PERFORMING_PRODUCTS_RENDER_MODULE = 'storybook/top-performing-products';
const PRODUCTS_REPORT_PATH = 'analytics/reports/products';

const storyWidgetType = createStoryWidgetType( widgetManifest );

interface TopPerformingProductsStoryControls {
	withComparison: boolean;
}

interface TopPerformingProductsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls, TopPerformingProductsStoryControls {}

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
function renderTopPerformingProductsWidget( {
	withComparison,
}: TopPerformingProductsStoryControls ) {
	return (
		<TopPerformingProductsRender
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
function TopPerformingProductsDashboardStory( {
	withComparison,
	...dashboardArgs
}: TopPerformingProductsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ TOP_PERFORMING_PRODUCTS_RENDER_MODULE }
			renderComponent={
				TopPerformingProductsRender as ComponentType< WidgetRenderProps< unknown > >
			}
			attributes={ { reportParams: storyReportParams( { withComparison } ) } }
		/>
	);
}

const meta = {
	title: 'Packages/WooCommerce Stats/Widgets/TopPerformingProducts',
	component: TopPerformingProductsRender,
	tags: [ 'autodocs' ],
	argTypes: storyControlArgTypes,
	parameters: {
		docs: {
			description: {
				component:
					'The "Top performing products" widget. Ranks the top physical products of the period by net revenue, with thumbnails and links to each product, and an optional previous-period comparison.',
			},
		},
	},
} satisfies Meta<
	ComponentProps< typeof TopPerformingProductsRender > & TopPerformingProductsStoryControls
>;

export default meta;

type Story = StoryObj< TopPerformingProductsStoryControls >;
type DashboardStory = StoryObj< TopPerformingProductsDashboardStoryProps >;

/**
 * The details mock answers one product fewer than the report ranks, so one row has no
 * thumbnail and no link, as a product the store deleted does.
 */
export const Default: Story = {
	render: renderTopPerformingProductsWidget,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas, withStoryRouter ],
	play: async ( { canvasElement } ) => {
		const canvas = within( canvasElement );
		await canvas.findAllByRole( 'listitem' );

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
	render: renderTopPerformingProductsWidget,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas, withStoryRouter ],
};

export const Loading: Story = {
	render: renderTopPerformingProductsWidget,
	args: { withComparison: false },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( PRODUCTS_REPORT_PATH, 'loading' ),
};

export const Empty: Story = {
	render: renderTopPerformingProductsWidget,
	args: { withComparison: false },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( PRODUCTS_REPORT_PATH, 'empty' ),
};

export const ErrorState: Story = {
	render: renderTopPerformingProductsWidget,
	args: { withComparison: false },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( PRODUCTS_REPORT_PATH, 'error' ),
};

export const ErrorRetryable: Story = {
	render: renderTopPerformingProductsWidget,
	args: { withComparison: false },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( PRODUCTS_REPORT_PATH, 'error-retryable' ),
};

export const WidgetDashboardWithWidget: DashboardStory = {
	tags: [ 'widget-dashboard' ],
	render: args => <TopPerformingProductsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		...storyControlArgTypes,
	},
};
