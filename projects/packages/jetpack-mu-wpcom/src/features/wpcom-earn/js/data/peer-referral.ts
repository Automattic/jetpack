import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { earnFetch } from '../earn-fetch.ts';
import { toPeerReferral } from './peer-referral-state.ts';

const peerReferralKey = [ 'earn', 'peer-referral' ] as const;

/**
 * The current user's referral link, or whether they can get one.
 *
 * @return The query.
 */
export function usePeerReferral() {
	return useQuery( {
		queryKey: peerReferralKey,
		queryFn: async () => {
			try {
				return toPeerReferral(
					await earnFetch< string >( { api: 'rest/v1.1', path: 'me/peer-referral-link' } )
				);
			} catch ( error ) {
				return toPeerReferral( null, error as { code?: string; error?: string } );
			}
		},
		retry: false,
	} );
}

/**
 * Turn referrals on for the current user.
 *
 * @return The mutation.
 */
export function useEnablePeerReferral() {
	const queryClient = useQueryClient();

	return useMutation( {
		mutationFn: () =>
			earnFetch< string >( {
				api: 'rest/v1.1',
				path: 'me/peer-referral-link-enable',
				method: 'POST',
				data: { enable: true },
			} ),
		onSuccess: link => queryClient.setQueryData( peerReferralKey, toPeerReferral( link ) ),
	} );
}
