import apiFetch from '@wordpress/api-fetch';
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { SELECTABLE_PRESETS, type SelectablePresetId } from '@jetpack-premium-analytics/datetime';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import TopPerformingBookingsRender from '../render';
import widgetDefinition from '../widget';
import type { APIFetchMiddleware } from '@wordpress/api-fetch';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const REPORT_PRODUCTS_PATH = '/jetpack-premium-analytics/v1/proxy/v2/analytics/reports/products';
const PRODUCT_IMAGES_PATH = '/wc/v3/products';

type ProductReportItem = {
	product_id: string;
	product_name: string;
	product_net_revenue: string;
	product_gross_revenue: string;
	product_type: string;
	orders_count: string;
	sku: string;
	total_quantity: string;
	stock_status: string;
};

const bookingProducts: ProductReportItem[] = [
	{
		product_id: '801',
		product_name: 'City tasting tour',
		product_net_revenue: '18640.00',
		product_gross_revenue: '21320.00',
		product_type: 'booking',
		orders_count: '84',
		sku: 'BOOK-CITY',
		total_quantity: '112',
		stock_status: 'instock',
	},
	{
		product_id: '802',
		product_name: 'Private lesson',
		product_net_revenue: '14220.00',
		product_gross_revenue: '15960.00',
		product_type: 'bookable-service',
		orders_count: '61',
		sku: 'BOOK-LESSON',
		total_quantity: '73',
		stock_status: 'instock',
	},
	{
		product_id: '803',
		product_name: 'Weekend retreat',
		product_net_revenue: '9350.00',
		product_gross_revenue: '10450.00',
		product_type: 'bookable-event',
		orders_count: '38',
		sku: 'BOOK-RETREAT',
		total_quantity: '46',
		stock_status: 'instock',
	},
	{
		product_id: '804',
		product_name: 'Strategy session',
		product_net_revenue: '5125.00',
		product_gross_revenue: '5900.00',
		product_type: 'booking',
		orders_count: '22',
		sku: 'BOOK-STRATEGY',
		total_quantity: '27',
		stock_status: 'instock',
	},
];

let productMocksRegistered = false;

function buildProductsResponse( products: ProductReportItem[] ) {
	const summary = products.reduce(
		( acc, product ) => ( {
			total_orders: acc.total_orders + Number( product.orders_count ),
			total_quantity: acc.total_quantity + Number( product.total_quantity ),
			total_revenue: acc.total_revenue + Number( product.product_net_revenue ),
		} ),
		{ total_orders: 0, total_quantity: 0, total_revenue: 0 }
	);

	return {
		data: products,
		summary: {
			total_orders: String( summary.total_orders ),
			total_products: String( products.length ),
			total_quantity: String( summary.total_quantity ),
			total_revenue: summary.total_revenue.toFixed( 2 ),
		},
	};
}

function registerProductLeaderboardMocks( products: ProductReportItem[] ) {
	if ( productMocksRegistered ) {
		return;
	}

	productMocksRegistered = true;

	const middleware: APIFetchMiddleware = async ( options, next ) => {
		const requestPath = options.path ?? options.url ?? '';

		if ( requestPath.startsWith( REPORT_PRODUCTS_PATH ) ) {
			return buildProductsResponse( products );
		}

		if ( requestPath.startsWith( PRODUCT_IMAGES_PATH ) ) {
			return products.map( product => ( {
				id: Number( product.product_id ),
				name: product.product_name,
				images: [],
			} ) );
		}

		return next( options );
	};

	apiFetch.use( middleware );
}

registerProductLeaderboardMocks( bookingProducts );

const TOP_PERFORMING_BOOKINGS_RENDER_MODULE = 'storybook/top-performing-bookings';
const DEFAULT_PRESET = 'last-30-days' satisfies SelectablePresetId;
const PRESET_OPTIONS = SELECTABLE_PRESETS;

type TopPerformingBookingsWidgetProps = ComponentProps< typeof TopPerformingBookingsRender >;

interface TopPerformingBookingsStoryControls {
	/**
	 * Whether to include comparison report params.
	 */
	withComparison: boolean;
	/**
	 * Date-range preset used for report params.
	 */
	preset: SelectablePresetId;
}

type TopPerformingBookingsStoryProps = TopPerformingBookingsWidgetProps &
	TopPerformingBookingsStoryControls;

interface TopPerformingBookingsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		TopPerformingBookingsStoryControls {}

const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

function getTopPerformingBookingsAttributes(
	withComparison = false,
	preset: SelectablePresetId = DEFAULT_PRESET
): TopPerformingBookingsWidgetProps[ 'attributes' ] {
	return {
		reportParams: getDefaultQueryParams( withComparison, preset ),
	};
}

function getDefaultQueryParamsSource( {
	withComparison,
	preset,
}: Partial< TopPerformingBookingsStoryControls > ) {
	const hasComparison = Boolean( withComparison );
	const storyPreset = preset ?? DEFAULT_PRESET;

	if ( ! hasComparison && storyPreset === DEFAULT_PRESET ) {
		return 'getDefaultQueryParams()';
	}

	if ( hasComparison && storyPreset === DEFAULT_PRESET ) {
		return 'getDefaultQueryParams( true )';
	}

	return `getDefaultQueryParams( ${ hasComparison ? 'true' : 'false' }, '${ storyPreset }' )`;
}

function getTopPerformingBookingsSource( args: Partial< TopPerformingBookingsStoryControls > ) {
	return `import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';

<TopPerformingBookingsRender
\tattributes={ {
\t\treportParams: ${ getDefaultQueryParamsSource( args ) },
\t} }
/>`;
}

function renderTopPerformingBookings( {
	withComparison,
	preset,
}: TopPerformingBookingsStoryControls ) {
	return (
		<TopPerformingBookingsRender
			attributes={ getTopPerformingBookingsAttributes( withComparison, preset ) }
		/>
	);
}

/**
 * Story wrapper for rendering the top performing bookings widget in dashboard chrome.
 *
 * @param {TopPerformingBookingsDashboardStoryProps} props - Story controls.
 * @return The rendered Storybook story.
 */
function TopPerformingBookingsDashboardStory( {
	withComparison,
	preset,
	...dashboardStoryArgs
}: TopPerformingBookingsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ TOP_PERFORMING_BOOKINGS_RENDER_MODULE }
			renderComponent={
				TopPerformingBookingsRender as ComponentType< WidgetRenderProps< unknown > >
			}
			attributes={ {
				reportParams: getDefaultQueryParams( withComparison, preset ),
			} }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/TopPerformingBookings',
	component: TopPerformingBookingsRender,
	tags: [ 'autodocs' ],
	argTypes: {
		preset: {
			control: 'select',
			options: PRESET_OPTIONS,
			description: 'Date-range preset used to generate the widget report params.',
		},
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params.',
		},
	},
	parameters: {
		docs: {
			description: {
				component:
					'Dashboard widget that displays top booking products by net revenue for the selected period.',
			},
		},
	},
} satisfies Meta< TopPerformingBookingsStoryProps >;

export default meta;

type Story = StoryObj< TopPerformingBookingsStoryControls >;
type DashboardStory = StoryObj< TopPerformingBookingsDashboardStoryProps >;

/**
 * Default state for the current report period.
 */
export const Default: Story = {
	render: renderTopPerformingBookings,
	args: {
		preset: DEFAULT_PRESET,
		withComparison: false,
	},
	decorators: [ withWidgetCanvas ],
	parameters: {
		docs: {
			source: {
				transform: (
					_source: string,
					storyContext: { args: Partial< TopPerformingBookingsStoryControls > }
				) => getTopPerformingBookingsSource( storyContext.args ),
			},
		},
	},
};

/**
 * Comparison period enabled, showing period-over-period change for each booking product.
 */
export const WithComparison: Story = {
	render: renderTopPerformingBookings,
	args: {
		preset: DEFAULT_PRESET,
		withComparison: true,
	},
	decorators: [ withWidgetCanvas ],
	parameters: {
		docs: {
			source: {
				transform: (
					_source: string,
					storyContext: { args: Partial< TopPerformingBookingsStoryControls > }
				) => getTopPerformingBookingsSource( storyContext.args ),
			},
		},
	},
};

/**
 * Renders the widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <TopPerformingBookingsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		preset: DEFAULT_PRESET,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		preset: {
			control: 'select',
			options: PRESET_OPTIONS,
			description: 'Date-range preset used to generate the widget report params.',
		},
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params.',
		},
	},
	parameters: {
		docs: {
			source: {
				code: `import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';

<WidgetDashboardWithWidget
\twidgetType={ widgetDefinition }
\trenderModule="storybook/top-performing-bookings"
\trenderComponent={ TopPerformingBookingsRender }
\tattributes={ {
\t\treportParams: getDefaultQueryParams( true ),
\t} }
/>`,
			},
		},
	},
};
