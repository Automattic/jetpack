import { useQuery } from '@tanstack/react-query';
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
