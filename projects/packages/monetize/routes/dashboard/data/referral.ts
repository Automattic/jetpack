import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { wpcomFetch } from './wpcom-fetch';
import type { WpcomApiError } from './wpcom-request';

const REFERRAL_LINK_KEY = [ 'monetize', 'referral-link' ] as const;

/**
 * The user's referral link, or '' until they turn referrals on.
 *
 * @param enabled - Whether to load it.
 * @return The query.
 */
export function useReferralLink( enabled: boolean ) {
	return useQuery< string, WpcomApiError >( {
		queryKey: REFERRAL_LINK_KEY,
		queryFn: async () =>
			( await wpcomFetch< string | null >( { api: 'wpcom/v2', path: 'me/peer-referral-link' } ) ) ||
			'',
		enabled,
	} );
}

/**
 * Turns on referrals for the user, which returns their link.
 *
 * @return The mutation.
 */
export function useEnableReferral() {
	const queryClient = useQueryClient();
	return useMutation< string, WpcomApiError >( {
		mutationFn: () =>
			wpcomFetch< string >( {
				api: 'wpcom/v2',
				path: 'me/peer-referral-link-enable',
				method: 'POST',
				data: { enable: true },
			} ),
		onSuccess: link => queryClient.setQueryData( REFERRAL_LINK_KEY, link ),
	} );
}
