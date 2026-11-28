import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { requestDSP } from '../../lib/promote-post';
import { CampaignReportRequestBody, CampaignReportResult } from './types';

export const useRequestCampaignReportMutation = ( onError: () => void ) => {
	const queryClient = useQueryClient();
	const mutation = useMutation( {
		mutationFn: async ( {
			siteId,
			campaignId,
			body,
		}: {
			siteId: number;
			campaignId: number;
			body: CampaignReportRequestBody;
		} ) =>
			await requestDSP< CampaignReportResult >(
				siteId,
				`/stats/${ campaignId }/report`,
				'POST',
				body,
				'1.1'
			),
		onSuccess( data, { siteId } ) {
			queryClient.invalidateQueries( {
				queryKey: [ 'promote-post-request-campaign-report', siteId ],
			} );
		},
		onError,
	} );
	const { mutateAsync } = mutation;
	const requestCampaignReport = useCallback(
		( siteId: number, campaignId: number, body: CampaignReportRequestBody ) =>
			mutateAsync( { siteId, campaignId, body } ),
		[ mutateAsync ]
	);
	return { requestCampaignReport, ...mutation };
};

export default useRequestCampaignReportMutation;
