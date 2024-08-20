import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import camelize from 'camelize';
import API from '../../api';
import { QUERY_WAF_KEY } from '../../constants';
import useNotices from '../../hooks/use-notices';

/**
 * Use WAF Mutatation
 *
 * @return {object} Mutation object
 */
export default function useWafMutation() {
	const queryClient = useQueryClient();
	const { showSuccessNotice, showSavingNotice, showErrorNotice } = useNotices();

	/**
	 * Get a custom error message based on the error code.
	 *
	 * @param {object} error - Error object.
	 * @return string|bool Custom error message or false if no custom message exists.
	 */
	const getCustomErrorMessage = useCallback( ( error: { [ key: string ]: unknown } ) => {
		switch ( error.code ) {
			case 'file_system_error':
				return __( 'A filesystem error occurred.', 'jetpack-protect' );
			case 'rules_api_error':
				return __(
					'An error occurred retrieving the latest firewall rules from Jetpack.',
					'jetpack-protect'
				);
			default:
				return __( 'An error occurred.', 'jetpack-protect' );
		}
	}, [] );

	return useMutation( {
		mutationFn: API.updateWaf,
		onMutate: config => {
			queryClient.setQueryData(
				[ QUERY_WAF_KEY ],
				( currentWaf: { [ key: string ]: unknown } ) => ( {
					...currentWaf,
					config: {
						...( currentWaf?.config as { [ key: string ]: unknown } ),
						...camelize( config ),
					},
				} )
			);

			showSavingNotice();
		},
		onSuccess: () => {
			queryClient.invalidateQueries( { queryKey: [ QUERY_WAF_KEY ] } );

			// Show a success notice.
			showSuccessNotice( __( 'Changes saved.', 'jetpack-protect' ) );
		},
		onError: ( error: { [ key: string ]: unknown } ) => {
			showErrorNotice( getCustomErrorMessage( error ) );
		},
	} );
}
