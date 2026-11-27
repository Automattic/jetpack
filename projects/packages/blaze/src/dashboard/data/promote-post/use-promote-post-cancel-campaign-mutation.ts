import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { requestDSP } from '../../lib/promote-post';
import { Campaign } from './types';

export const useCancelCampaignMutation = ( onError: () => void ) => {
	const queryClient = useQueryClient();
	const mutation = useMutation( {
		mutationFn: async ( { siteId, campaignId }: { siteId: number; campaignId: number } ) =>
			await requestDSP< { results: Campaign[] } >( siteId, `/campaigns/${ campaignId }/stop` ),
		onSuccess( data, { siteId } ) {
			queryClient.invalidateQueries( {
				queryKey: [ 'promote-post-campaigns', siteId ],
			} );
		},
		onError,
	} );

	const { mutate } = mutation;
	const cancelCampaign = useCallback(
		( siteId: number, campaignId: number ) => mutate( { siteId, campaignId } ),
		[ mutate ]
	);

	return { cancelCampaign, ...mutation };
};

export default useCancelCampaignMutation;
