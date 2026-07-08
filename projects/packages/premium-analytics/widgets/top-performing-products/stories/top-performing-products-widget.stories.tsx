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
import TopPerformingProductsRender from '../render';
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

const physicalProducts: ProductReportItem[] = [
	{
		product_id: '701',
		product_name: 'Performance hoodie',
		product_net_revenue: '24880.00',
		product_gross_revenue: '27620.00',
		product_type: 'simple',
		orders_count: '212',
		sku: 'APP-HOODIE',
		total_quantity: '254',
		stock_status: 'instock',
	},
	{
		product_id: '702',
		product_name: 'Merino travel tee',
		product_net_revenue: '18240.00',
		product_gross_revenue: '20480.00',
		product_type: 'variation',
		orders_count: '175',
		sku: 'APP-TEE',
		total_quantity: '220',
		stock_status: 'instock',
	},
	{
		product_id: '703',
		product_name: 'Canvas weekender',
		product_net_revenue: '13650.00',
		product_gross_revenue: '15120.00',
		product_type: 'variable',
		orders_count: '91',
		sku: 'ACC-BAG',
		total_quantity: '102',
		stock_status: 'instock',
	},
	{
		product_id: '704',
		product_name: 'Insulated bottle',
		product_net_revenue: '7425.00',
		product_gross_revenue: '8125.00',
		product_type: 'simple',
		orders_count: '148',
		sku: 'ACC-BOTTLE',
		total_quantity: '180',
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

registerProductLeaderboardMocks( physicalProducts );

const TOP_PERFORMING_PRODUCTS_RENDER_MODULE = 'storybook/top-performing-products';
const DEFAULT_PRESET = 'last-30-days' satisfies SelectablePresetId;
const PRESET_OPTIONS = SELECTABLE_PRESETS;

type TopPerformingProductsWidgetProps = ComponentProps< typeof TopPerformingProductsRender >;
const noopSetError: TopPerformingProductsWidgetProps[ 'setError' ] = () => undefined;

interface TopPerformingProductsStoryControls {
	withComparison: boolean;
	preset: SelectablePresetId;
}

type TopPerformingProductsStoryProps = TopPerformingProductsWidgetProps &
	TopPerformingProductsStoryControls;

interface TopPerformingProductsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		TopPerformingProductsStoryControls {}

const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

function getTopPerformingProductsAttributes(
	withComparison = false,
	preset: SelectablePresetId = DEFAULT_PRESET
): TopPerformingProductsWidgetProps[ 'attributes' ] {
	return {
		reportParams: getDefaultQueryParams( withComparison, preset ),
	};
}

function getDefaultQueryParamsSource( {
	withComparison,
	preset,
}: Partial< TopPerformingProductsStoryControls > ) {
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

function getTopPerformingProductsSource( args: Partial< TopPerformingProductsStoryControls > ) {
	return `import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';

<TopPerformingProductsRender
\tattributes={ {
\t\treportParams: ${ getDefaultQueryParamsSource( args ) },
\t} }
\tsetError={ () => undefined }
/>`;
}

function renderTopPerformingProducts( {
	withComparison,
	preset,
}: TopPerformingProductsStoryControls ) {
	return (
		<TopPerformingProductsRender
			attributes={ getTopPerformingProductsAttributes( withComparison, preset ) }
			setError={ noopSetError }
		/>
	);
}

function TopPerformingProductsDashboardStory( {
	withComparison,
	preset,
	...dashboardStoryArgs
}: TopPerformingProductsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ TOP_PERFORMING_PRODUCTS_RENDER_MODULE }
			renderComponent={
				TopPerformingProductsRender as ComponentType< WidgetRenderProps< unknown > >
			}
			attributes={ getTopPerformingProductsAttributes( withComparison, preset ) }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/TopPerformingProducts',
	component: TopPerformingProductsRender,
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
					'Dashboard widget that displays top products by net revenue for the selected period.',
			},
		},
	},
} satisfies Meta< TopPerformingProductsStoryProps >;

export default meta;

type Story = StoryObj< TopPerformingProductsStoryControls >;
type DashboardStory = StoryObj< TopPerformingProductsDashboardStoryProps >;

/**
 * Default state for the current report period.
 */
export const Default: Story = {
	render: renderTopPerformingProducts,
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
					storyContext: { args: Partial< TopPerformingProductsStoryControls > }
				) => getTopPerformingProductsSource( storyContext.args ),
			},
		},
	},
};

/**
 * Comparison period enabled, showing period-over-period product revenue changes.
 */
export const WithComparison: Story = {
	render: renderTopPerformingProducts,
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
					storyContext: { args: Partial< TopPerformingProductsStoryControls > }
				) => getTopPerformingProductsSource( storyContext.args ),
			},
		},
	},
};

/**
 * Renders the widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <TopPerformingProductsDashboardStory { ...args } />,
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
\trenderModule="storybook/top-performing-products"
\trenderComponent={ TopPerformingProductsRender }
\tattributes={ {
\t\treportParams: getDefaultQueryParams( true ),
\t} }
/>`,
			},
		},
	},
};
