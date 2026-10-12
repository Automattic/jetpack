import { useQuery } from '@tanstack/react-query';
import { earnFetch } from '../earn-fetch.ts';

interface StatusResponse {
	connected_account_id?: number | null;
	is_connected?: boolean;
	connect_url?: string | null;
}

export interface MembershipsStatus {
	/** Whether a Stripe account is connected. */
	isConnected: boolean;
	connectUrl: string | null;
}

interface ProductsResponse {
	products?: Array< { id: number | string; title: string } >;
}

export interface MembershipsEarnings {
	total: number;
	lastMonth: number;
	forecast: number;
	currency: string;
	/** The transaction fee as a fraction, or null when the plan has none to report. */
	commission: number | null;
}

interface EarningsResponse {
	total?: number;
	last_month?: number;
	forecast?: number;
	currency?: string;
	commission?: number | null;
}

export const membershipsKeys = {
	status: () => [ 'earn', 'memberships', 'status' ] as const,
	products: () => [ 'earn', 'memberships', 'products' ] as const,
	earnings: () => [ 'earn', 'memberships', 'earnings' ] as const,
};

/**
 * The site's Stripe connection.
 *
 * @return The query.
 */
export function useMembershipsStatus() {
	return useQuery( {
		queryKey: membershipsKeys.status(),
		queryFn: () =>
			earnFetch< StatusResponse >( {
				api: 'wpcom/v2',
				path: 'memberships/status',
				query: { source: 'calypso' },
			} ),
		select: ( data ): MembershipsStatus => ( {
			isConnected: data.is_connected ?? ( data.connected_account_id ?? 0 ) > 0,
			connectUrl: data.connect_url ?? null,
		} ),
	} );
}

/**
 * Every payment plan, newsletter tier and donation the site offers.
 *
 * @return The query.
 */
export function useMembershipsProducts() {
	return useQuery( {
		queryKey: membershipsKeys.products(),
		queryFn: () =>
			earnFetch< ProductsResponse >( {
				api: 'wpcom/v2',
				path: 'memberships/products',
				query: { type: 'all', is_editable: true },
			} ),
		select: data => data.products ?? [],
	} );
}

/**
 * What the site has earned from payments, with next month's forecast.
 *
 * @return The query.
 */
export function useMembershipsEarnings() {
	return useQuery( {
		queryKey: membershipsKeys.earnings(),
		queryFn: () =>
			earnFetch< EarningsResponse >( { api: 'wpcom/v2', path: 'memberships/earnings' } ),
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
