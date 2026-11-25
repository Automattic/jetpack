import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { wpcomFetch } from './wpcom-fetch';

export const EARNINGS_KEY = [ 'monetize', 'memberships', 'earnings' ];

interface EarningsResponse {
	total?: number;
	last_month?: number;
	forecast?: number;
	currency?: string;
	commission?: number | null;
}

export interface MembershipsEarnings {
	total: number;
	lastMonth: number;
	forecast: number;
	currency: string;
	/** The plan's transaction fee as a fraction, or null when WordPress.com doesn't say. */
	commission: number | null;
}

/**
 * What the site has earned from payments, with next month's forecast.
 *
 * @return The query.
 */
export function useMembershipsEarnings() {
	return useQuery( {
		queryKey: EARNINGS_KEY,
		queryFn: () =>
			wpcomFetch< EarningsResponse >( { api: 'wpcom/v2', path: 'memberships/earnings' } ),
		select: ( data ): MembershipsEarnings => ( {
			total: data.total ?? 0,
			lastMonth: data.last_month ?? 0,
			forecast: data.forecast ?? 0,
			// Calypso falls back to USD the same way.
			currency: data.currency ?? 'USD',
			commission: data.commission ?? null,
		} ),
	} );
}

/**
 * The Stripe source WordPress.com returns to this dashboard from.
 */
const STRIPE_SOURCE = 'jetpack-monetize';

const STATUS_KEY = [ 'monetize', 'memberships', 'status' ];
const PRODUCTS_KEY = [ 'monetize', 'memberships', 'products' ];

interface StatusResponse {
	is_connected?: boolean;
	connected_account_id?: number | null;
	connected_account_description?: string | null;
	connect_url?: string | null;
	store_context?: string | null;
	coupons_and_gifts_enabled?: boolean | null;
	connected_account_default_currency?: string | null;
	connected_account_minimum_currency?: Record< string, number > | null;
	connected_account_accepts_charges?: boolean;
}

export interface StripeStatus {
	isConnected: boolean;
	/** The Stripe account, or the last one when disconnected. */
	accountDescription: string;
	connectUrl: string;
	isSandbox: boolean;
	/** Whether WordPress.com has coupons turned on for the site; only known once Stripe is connected. */
	couponsEnabled: boolean;
	/** The Stripe account's currency, upper-cased. */
	defaultCurrency: string;
	/** Each supported currency's smallest charge. */
	minimumAmounts: Record< string, number >;
	acceptsCharges: boolean;
}

/**
 * The site's Stripe connection.
 *
 * @return The query.
 */
export function useStripeStatus() {
	return useQuery( {
		queryKey: STATUS_KEY,
		queryFn: () =>
			wpcomFetch< StatusResponse >( {
				api: 'wpcom/v2',
				path: 'memberships/status',
				query: { source: STRIPE_SOURCE },
			} ),
		select: ( data ): StripeStatus => ( {
			isConnected: data.is_connected ?? ( data.connected_account_id ?? 0 ) > 0,
			accountDescription: data.connected_account_description ?? '',
			connectUrl: data.connect_url ?? '',
			isSandbox: data.store_context === 'sandbox',
			couponsEnabled: Boolean( data.coupons_and_gifts_enabled ),
			defaultCurrency: ( data.connected_account_default_currency ?? '' ).toUpperCase(),
			minimumAmounts: data.connected_account_minimum_currency ?? {},
			acceptsCharges: data.connected_account_accepts_charges ?? true,
		} ),
	} );
}

/**
 * Disconnects the site's Stripe account.
 *
 * @return The mutation.
 */
export function useDisconnectStripe() {
	const queryClient = useQueryClient();
	return useMutation( {
		mutationFn: () =>
			wpcomFetch( { api: 'wpcom/v2', path: 'memberships/stripe/disconnect', method: 'POST' } ),
		onSettled: () => queryClient.invalidateQueries( { queryKey: STATUS_KEY } ),
	} );
}

export interface MembershipProduct {
	id: number;
	title: string;
	description: string;
	/** The description as WordPress.com renders its Markdown, when it sends it. */
	descriptionHtml: string;
	price: number;
	currency: string;
	/** `1 month`, `1 year` or `one-time`. */
	interval: string;
	type: string;
	/** For a tier's annual product, the monthly product it belongs to. */
	tier: number | null;
	isReadOnly: boolean;
	welcomeEmailContent: string;
	buyerCanChangeAmount: boolean;
	multiplePerUser: boolean;
	subscribeAsSiteSubscriber: boolean;
}

interface ProductResponse {
	id?: number | string;
	connected_account_product_id?: number | string;
	title?: string;
	description?: string | null;
	description_rendered?: string | null;
	price?: number | string;
	currency?: string;
	interval?: string;
	type?: string | null;
	tier?: number | string | null;
	is_read_only?: boolean;
	welcome_email_content?: string | null;
	buyer_can_change_amount?: boolean;
	multiple_per_user?: boolean;
	subscribe_as_site_subscriber?: boolean;
}

/**
 * A product as the API sends it, as Calypso's `membershipProductFromApi()` reads it.
 *
 * @param product - The API's product.
 * @return The product.
 */
export function toMembershipProduct( product: ProductResponse ): MembershipProduct {
	return {
		id: Number( product.id || product.connected_account_product_id ),
		title: product.title ?? '',
		description: product.description ?? '',
		descriptionHtml: product.description_rendered ?? '',
		price: Number( product.price ) || 0,
		currency: product.currency ?? 'USD',
		interval: product.interval ?? 'one-time',
		type: product.type ?? '',
		tier: product.tier ? Number( product.tier ) : null,
		isReadOnly: Boolean( product.is_read_only ),
		welcomeEmailContent: product.welcome_email_content ?? '',
		buyerCanChangeAmount: Boolean( product.buyer_can_change_amount ),
		multiplePerUser: Boolean( product.multiple_per_user ),
		subscribeAsSiteSubscriber: Boolean( product.subscribe_as_site_subscriber ),
	};
}

/**
 * The site's payment plans.
 *
 * @return The query.
 */
export function useMembershipProducts() {
	return useQuery( {
		queryKey: PRODUCTS_KEY,
		queryFn: () =>
			wpcomFetch< { products?: ProductResponse[] } >( {
				api: 'wpcom/v2',
				path: 'memberships/products',
				query: { type: 'all', is_editable: true },
			} ),
		select: data => ( data.products ?? [] ).map( toMembershipProduct ),
	} );
}

export class DeleteProductsError extends Error {
	/** The products that are still there, to retry. */
	failedIds: number[];

	constructor( message: string, failedIds: number[] ) {
		super( message );
		this.name = 'DeleteProductsError';
		this.failedIds = failedIds;
	}
}

/**
 * Deletes payment plans, such as a tier's monthly and annual products together.
 *
 * @return The mutation.
 * @throws {DeleteProductsError} When any product could not be deleted.
 */
export function useDeleteProducts() {
	const queryClient = useQueryClient();
	return useMutation( {
		mutationFn: async ( {
			ids,
			cancelSubscriptions,
		}: {
			ids: number[];
			cancelSubscriptions: boolean;
		} ) => {
			const results = await Promise.allSettled(
				ids.map( id =>
					wpcomFetch( {
						api: 'wpcom/v2',
						path: `memberships/product/${ id }`,
						method: 'DELETE',
						data: { cancel_subscriptions: cancelSubscriptions },
					} )
				)
			);
			const failed = results.flatMap( ( result, index ) =>
				result.status === 'rejected' ? [ { id: ids[ index ], reason: result.reason } ] : []
			);
			if ( failed.length ) {
				throw new DeleteProductsError(
					( failed[ 0 ].reason as Error )?.message ?? '',
					failed.map( ( { id } ) => id )
				);
			}
		},
		onSettled: () => queryClient.invalidateQueries( { queryKey: PRODUCTS_KEY } ),
	} );
}

/**
 * A plan's fields as the product endpoints take them.
 */
export interface ProductPayload {
	title: string;
	price: number;
	currency: string;
	interval: string;
	type?: 'tier';
	tier?: number;
	description?: string;
	welcome_email_content: string;
	buyer_can_change_amount: boolean;
	multiple_per_user: boolean;
	subscribe_as_site_subscriber: boolean;
	is_editable: true;
}

/**
 * Creates a product, or updates it when it has an ID.
 *
 * @param payload - The product's fields.
 * @param id      - The product's ID, when it exists.
 * @return The saved product's ID.
 */
async function saveProduct( payload: ProductPayload, id?: number ): Promise< number > {
	const response = await wpcomFetch< ProductResponse & { product?: ProductResponse } >( {
		api: 'wpcom/v2',
		path: id ? `memberships/product/${ id }` : 'memberships/product',
		method: 'POST',
		data: payload,
	} );
	// Updates wrap the product; creates return it bare.
	return toMembershipProduct( response.product ?? response ).id;
}

/**
 * Saves a plan; a tier's annual product is saved after its monthly one, so it can name it.
 *
 * @return The mutation.
 */
export function useSavePlan() {
	const queryClient = useQueryClient();
	// A retry after the annual save fails updates the monthly product it already created.
	const savedMonthlyId = useRef< number >( undefined );
	return useMutation( {
		mutationFn: async ( {
			payload,
			annualPrice,
			ids = {},
		}: {
			payload: ProductPayload;
			/** Set for a tier. */
			annualPrice?: number;
			/** The existing products, when editing. */
			ids?: { monthly?: number; annual?: number };
		} ) => {
			const monthlyId = await saveProduct( payload, ids.monthly ?? savedMonthlyId.current );
			savedMonthlyId.current = monthlyId;
			if ( annualPrice !== undefined ) {
				await saveProduct(
					{ ...payload, price: annualPrice, interval: '1 year', tier: monthlyId },
					ids.annual
				);
			}
		},
		// Refetch even after a partial failure, since the monthly product may have saved.
		onSettled: () => queryClient.invalidateQueries( { queryKey: PRODUCTS_KEY } ),
	} );
}
