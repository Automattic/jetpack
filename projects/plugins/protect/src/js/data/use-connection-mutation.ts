import { useConnection } from '@automattic/jetpack-connection';
import { type ScanStatus } from '@automattic/jetpack-scan';
import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import {
	QUERY_CREDENTIALS_KEY,
	QUERY_HAS_PLAN_KEY,
	QUERY_HISTORY_KEY,
	QUERY_SCAN_STATUS_KEY,
	QUERY_WAF_KEY,
	SCAN_STATUS_OPTIMISTICALLY_SCANNING,
} from '../constants';
import useNotices from '../hooks/use-notices';

/**
 * Connect Site Mutation
 *
 * Mutation hook that triggers the Jetpack connection process for a site.
 *
 * @return {UseMutationResult} useMutation result.
 */
export default function useConnectSiteMutation(): UseMutationResult {
	const queryClient = useQueryClient();
	const { showErrorNotice } = useNotices();

	const { handleRegisterSite } = useConnection( {
		autoTrigger: false,
		from: 'protect',
		redirectUri: null,
		skipUserConnection: true,
	} );

	return useMutation( {
		mutationFn: handleRegisterSite,
		onSuccess: async () => {
			// Optimistically update the scan status to 'scanning'.
			queryClient.setQueryData( [ QUERY_SCAN_STATUS_KEY ], ( scanStatus: ScanStatus ) => ( {
				...scanStatus,
				status: SCAN_STATUS_OPTIMISTICALLY_SCANNING,
			} ) );

			// Invalidate all queries that depend on the connection status.
			queryClient.invalidateQueries( { queryKey: [ QUERY_HISTORY_KEY ] } );
			queryClient.invalidateQueries( { queryKey: [ QUERY_WAF_KEY ] } );
			queryClient.invalidateQueries( { queryKey: [ QUERY_HAS_PLAN_KEY ] } );
			queryClient.invalidateQueries( { queryKey: [ QUERY_CREDENTIALS_KEY ] } );
		},
		onError: () => {
			showErrorNotice( __( 'Could not connect site.', 'jetpack-protect' ) );
		},
	} );
}
