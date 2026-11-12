import { useQuery } from '@tanstack/react-query';
import { wpcomFetch } from './wpcom-fetch';

interface StatusResponse {
	connected_account_id?: number;
	is_connected?: boolean;
}

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
 * Whether the site has connected a Stripe account.
 *
 * @param enabled - Whether the page can call WordPress.com.
 * @return The query.
 */
export function useIsStripeConnected( enabled: boolean ) {
	return useQuery( {
		queryKey: [ 'monetize', 'memberships', 'status' ],
		queryFn: () => wpcomFetch< StatusResponse >( { api: 'wpcom/v2', path: 'memberships/status' } ),
		select: data => data.is_connected ?? ( data.connected_account_id ?? 0 ) > 0,
		enabled,
	} );
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
