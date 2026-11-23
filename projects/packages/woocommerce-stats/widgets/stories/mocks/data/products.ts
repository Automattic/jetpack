/**
 * Internal dependencies
 */
import { ANCHOR_DAY, bucketsForWindow, count, money, windowDays } from './interval-buckets';

/** How much the store grows per day, and how far a product's season swings its share. */
const GROWTH_PER_DAY = 0.004;
const SEASONAL_SWING = 0.45;

export type CatalogueProduct = {
	id: number;
	name: string;
	slug: string;
	sku: string;
	type: string;
	stock_status: string;
	/** Net revenue per day before the window's seasonal swing. */
	dailyRevenue: number;
	/** Where in the seasonal cycle this product peaks, so the ranking moves between windows. */
	phase: number;
};

export const PRODUCT_CATALOGUE: CatalogueProduct[] = [
	{
		id: 18,
		name: 'Cast Iron Skillet',
		slug: 'cast-iron-skillet',
		sku: 'KIT-SKILLET-12',
		type: 'simple',
		stock_status: 'instock',
		dailyRevenue: 206,
		phase: 0,
	},
	{
		id: 19,
		name: 'Merino Wool Beanie',
		slug: 'merino-wool-beanie',
		sku: 'APP-BEANIE-OS',
		type: 'variable',
		stock_status: 'instock',
		dailyRevenue: 192,
		phase: 0.8,
	},
	{
		id: 20,
		name: 'Stoneware Mug Set',
		slug: 'stoneware-mug-set',
		sku: 'KIT-MUGSET-04',
		type: 'simple',
		stock_status: 'instock',
		dailyRevenue: 178,
		phase: 1.6,
	},
	{
		id: 21,
		name: 'Leather Weekender Bag',
		slug: 'leather-weekender-bag',
		sku: 'BAG-WEEKEND-01',
		type: 'simple',
		stock_status: 'onbackorder',
		dailyRevenue: 168,
		phase: 2.4,
	},
	{
		id: 22,
		name: 'Bamboo Cutting Board',
		slug: 'bamboo-cutting-board',
		sku: 'KIT-BOARD-LG',
		type: 'simple',
		stock_status: 'instock',
		dailyRevenue: 158,
		phase: 3.2,
	},
	{
		id: 23,
		name: 'Linen Apron',
		slug: 'linen-apron',
		sku: 'APP-APRON-NAT',
		type: 'variable',
		stock_status: 'instock',
		dailyRevenue: 148,
		phase: 4,
	},
	{
		id: 24,
		name: 'Copper Watering Can',
		slug: 'copper-watering-can',
		sku: 'GRD-CAN-2L',
		type: 'simple',
		stock_status: 'outofstock',
		dailyRevenue: 138,
		phase: 4.8,
	},
	{
		id: 25,
		name: 'Walnut Pepper Mill',
		slug: 'walnut-pepper-mill',
		sku: 'KIT-MILL-WAL',
		type: 'simple',
		stock_status: 'instock',
		dailyRevenue: 128,
		phase: 5.6,
	},
];

/**
 * Kept apart from `PRODUCT_CATALOGUE` so a request with no product-type filter ranks, and totals,
 * exactly the physical products it always has.
 */
export const BOOKABLE_CATALOGUE: CatalogueProduct[] = [
	{
		id: 26,
		name: 'Sourdough Baking Workshop',
		slug: 'sourdough-baking-workshop',
		sku: 'BKG-SOURDOUGH',
		type: 'booking',
		stock_status: 'instock',
		dailyRevenue: 96,
		phase: 0.4,
	},
	{
		id: 27,
		name: 'Saturday Pottery Class',
		slug: 'saturday-pottery-class',
		sku: 'BKG-POTTERY',
		type: 'bookable-event',
		stock_status: 'instock',
		dailyRevenue: 84,
		phase: 2.1,
	},
	{
		id: 28,
		name: 'Private Tasting Session',
		slug: 'private-tasting-session',
		sku: 'BKG-TASTING',
		type: 'bookable-service',
		stock_status: 'instock',
		dailyRevenue: 72,
		phase: 3.9,
	},
];

const seasonalWeight = ( product: CatalogueProduct, dayIndex: number ) =>
	product.dailyRevenue * ( 1 + SEASONAL_SWING * Math.sin( dayIndex / 40 + product.phase ) );

const sum = ( values: number[] ) => values.reduce( ( total, value ) => total + value, 0 );

/**
 * The store's net revenue over a window. The seasons only redistribute it between products, so
 * the store's total depends on the window alone and a later window always reads higher.
 *
 * @param {CatalogueProduct[]} catalogue - The products the report covers.
 * @param {number}             dayIndex  - The window's first day.
 * @param {number}             spanDays  - How many days the window covers.
 * @return {number} The window's net revenue.
 */
function storeRevenue( catalogue: CatalogueProduct[], dayIndex: number, spanDays: number ): number {
	const growth = Math.max( 0.1, 1 + GROWTH_PER_DAY * ( dayIndex - ANCHOR_DAY ) );

	return sum( catalogue.map( product => product.dailyRevenue ) ) * spanDays * growth;
}

/**
 * The product types a request filters by. `addQueryArgs` flattens `filters` into bracketed keys
 * such as `filters[0][value][1]`, so the filter's key and its values are matched by index.
 * Every `product_type` filter is treated as `IN`; its `compare` operator is not read.
 *
 * @param {URLSearchParams} query - The request's query params.
 * @return {string[]} The requested product types, empty when the request has no such filter.
 */
function requestedProductTypes( query: URLSearchParams ): string[] {
	const filterIndexes = [ ...query ]
		.filter(
			( [ name, value ] ) => /^filters\[\d+\]\[key\]$/.test( name ) && value === 'product_type'
		)
		.map( ( [ name ] ) => name.match( /\d+/ )?.[ 0 ] );

	return [ ...query ]
		.filter( ( [ name ] ) =>
			filterIndexes.some( index =>
				new RegExp( `^filters\\[${ index }\\]\\[value\\](\\[\\d+\\])?$` ).test( name )
			)
		)
		.map( ( [ , value ] ) => value );
}

/**
 * The products report of a window: the store's catalogue ranked by net revenue, sliced to the
 * requested `limit`. The ranking ignores `orderby` and always sorts by net revenue. A
 * `product_type` filter restricts the catalogue to the matching types, bookable products included.
 *
 * @param {URLSearchParams} query - The request's query params (`from`, `to`, `limit`, `filters`).
 * @return {unknown} The raw report response.
 */
export function buildProductsResponse( query: URLSearchParams ): unknown {
	const buckets = bucketsForWindow( query );
	const dayIndex = buckets[ 0 ]?.dayIndex ?? 0;
	const types = requestedProductTypes( query );
	const catalogue = types.length
		? [ ...PRODUCT_CATALOGUE, ...BOOKABLE_CATALOGUE ].filter( product =>
				types.includes( product.type )
			)
		: PRODUCT_CATALOGUE;
	const limit = Number( query.get( 'limit' ) ) || catalogue.length;

	const weights = catalogue.map( product => seasonalWeight( product, dayIndex ) );
	const revenuePerWeight =
		storeRevenue( catalogue, dayIndex, windowDays( buckets ) ) / ( sum( weights ) || 1 );

	const ranked = catalogue
		.map( ( product, index ) => ( {
			product,
			revenue: revenuePerWeight * weights[ index ],
		} ) )
		.sort( ( left, right ) => right.revenue - left.revenue );

	return {
		data: ranked.slice( 0, limit ).map( ( { product, revenue } ) => ( {
			product_id: String( product.id ),
			product_name: product.name,
			product_net_revenue: money( revenue ),
			product_gross_revenue: money( revenue * 1.07 ),
			product_type: product.type,
			orders_count: count( revenue / 46 ),
			sku: product.sku,
			total_quantity: count( revenue / 26 ),
			stock_status: product.stock_status,
		} ) ),
		// Totals over every ranked product, not only the `limit` rows returned.
		summary: {
			total_orders: count( ranked.reduce( ( total, row ) => total + row.revenue / 46, 0 ) ),
			total_products: String( ranked.length ),
			total_quantity: count( ranked.reduce( ( total, row ) => total + row.revenue / 26, 0 ) ),
			total_revenue: money( ranked.reduce( ( total, row ) => total + row.revenue, 0 ) ),
		},
	};
}
