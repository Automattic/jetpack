import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { wpcomFetch } from './wpcom-fetch';

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
		queryKey: [ 'monetize', 'memberships', 'earnings' ],
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
export const STRIPE_SOURCE = 'jetpack-monetize';

const STATUS_KEY = [ 'monetize', 'memberships', 'status' ];
const PRODUCTS_KEY = [ 'monetize', 'memberships', 'products' ];

interface StatusResponse {
	is_connected?: boolean;
	connected_account_id?: number | null;
	connected_account_description?: string | null;
	connect_url?: string | null;
	store_context?: string | null;
}

export interface StripeStatus {
	isConnected: boolean;
	/** The Stripe account, or the last one when disconnected. */
	accountDescription: string;
	connectUrl: string;
	isSandbox: boolean;
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
	price: number;
	currency: string;
	/** `1 month`, `1 year` or `one-time`. */
	interval: string;
	type: string;
	/** For a tier's annual product, the monthly product it belongs to. */
	tier: number | null;
	isReadOnly: boolean;
}

interface ProductResponse {
	id?: number | string;
	connected_account_product_id?: number | string;
	title?: string;
	description?: string | null;
	price?: number | string;
	currency?: string;
	interval?: string;
	type?: string | null;
	tier?: number | string | null;
	is_read_only?: boolean;
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
		price: Number( product.price ) || 0,
		currency: product.currency ?? 'USD',
		interval: product.interval ?? 'one-time',
		type: product.type ?? '',
		tier: product.tier ? Number( product.tier ) : null,
		isReadOnly: Boolean( product.is_read_only ),
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

/**
 * Deletes payment plans, such as a tier's monthly and annual products together.
 *
 * @return The mutation.
 */
export function useDeleteProducts() {
	const queryClient = useQueryClient();
	return useMutation( {
		mutationFn: ( { ids, cancelSubscriptions }: { ids: number[]; cancelSubscriptions: boolean } ) =>
			Promise.all(
				ids.map( id =>
					wpcomFetch( {
						api: 'wpcom/v2',
						path: `memberships/product/${ id }`,
						method: 'DELETE',
						data: { cancel_subscriptions: cancelSubscriptions },
					} )
				)
			),
		// Refetch even after a partial failure, since one of the pair may be gone.
		onSettled: () => queryClient.invalidateQueries( { queryKey: PRODUCTS_KEY } ),
	} );
}
