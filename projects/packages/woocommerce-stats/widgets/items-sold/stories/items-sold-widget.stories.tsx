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
import ItemsSoldRender from '../render';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerWooReportMocks();

const ITEMS_SOLD_RENDER_MODULE = 'storybook/items-sold';
const ORDERS_REPORT_PATH = 'analytics/reports/orders/by-date';

const storyWidgetType = createStoryWidgetType( widgetManifest );

interface ItemsSoldStoryControls {
	withComparison: boolean;
	chartType: 'line' | 'bar';
}

interface ItemsSoldDashboardStoryProps
	extends WidgetDashboardWithWidgetControls, ItemsSoldStoryControls {}

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
function renderItemsSoldWidget( { withComparison, chartType }: ItemsSoldStoryControls ) {
	return (
		<ItemsSoldRender
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
function ItemsSoldDashboardStory( {
	withComparison,
	chartType,
	...dashboardArgs
}: ItemsSoldDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ ITEMS_SOLD_RENDER_MODULE }
			renderComponent={ ItemsSoldRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: storyReportParams( { withComparison } ), chartType } }
		/>
	);
}

const meta = {
	title: 'Packages/WooCommerce Stats/Widgets/ItemsSold',
	component: ItemsSoldRender,
	tags: [ 'autodocs' ],
	argTypes: storyControlArgTypes,
	parameters: {
		docs: {
			description: {
				component:
					'The "Items sold" widget. Charts the number of items sold per interval from the store orders report, with an optional previous-period comparison.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof ItemsSoldRender > & ItemsSoldStoryControls >;

export default meta;

type Story = StoryObj< ItemsSoldStoryControls >;
type DashboardStory = StoryObj< ItemsSoldDashboardStoryProps >;

export const Default: Story = {
	render: renderItemsSoldWidget,
	args: { withComparison: false, chartType: 'line' },
	decorators: [ withWidgetCanvas ],
};

export const WithComparison: Story = {
	render: renderItemsSoldWidget,
	args: { withComparison: true, chartType: 'line' },
	decorators: [ withWidgetCanvas ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: renderItemsSoldWidget,
	args: { withComparison: false, chartType: 'line' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( ORDERS_REPORT_PATH, 'loading' ),
};

/**
 * Resolved with no rows: the widget shows the generic empty state.
 */
export const Empty: Story = {
	render: renderItemsSoldWidget,
	args: { withComparison: false, chartType: 'line' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( ORDERS_REPORT_PATH, 'empty' ),
};

/**
 * The fetch failed with a permission-gated 403: the widget shows the neutral
 * "You don't have access to this data." copy and no Retry action, since a
 * permission gate is deterministic and retrying cannot clear it.
 */
export const ErrorState: Story = {
	render: renderItemsSoldWidget,
	args: { withComparison: false, chartType: 'line' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( ORDERS_REPORT_PATH, 'error' ),
};

/**
 * The fetch failed in a way that can heal, the proxy's `no_connection` 403: the
 * widget shows its retryable copy with a Retry action, which re-runs the query
 * (still mocked as failing while this story is active).
 */
export const ErrorRetryable: Story = {
	render: renderItemsSoldWidget,
	args: { withComparison: false, chartType: 'line' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( ORDERS_REPORT_PATH, 'error-retryable' ),
};

export const WidgetDashboardWithWidget: DashboardStory = {
	tags: [ 'widget-dashboard' ],
	render: args => <ItemsSoldDashboardStory { ...args } />,
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
