import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import camelize from 'camelize';
import API from '../../api';
import { QUERY_WAF_KEY } from '../../constants';
import useNotices from '../../hooks/use-notices';
import { WafStatus } from '../../types/waf';

/**
 * WAF Mutatation Hook
 *
 * @return {UseMutationResult} useMutation result.
 */
export default function useWafMutation(): UseMutationResult<
	unknown,
	{ [ key: string ]: unknown },
	unknown,
	{ initialValue: WafStatus }
> {
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
			showSavingNotice();

			// Get the current WAF config.
			const initialValue = queryClient.getQueryData( [ QUERY_WAF_KEY ] ) as WafStatus;

			// Optimistically update the WAF config.
			queryClient.setQueryData( [ QUERY_WAF_KEY ], ( wafStatus: WafStatus ) => ( {
				...wafStatus,
				config: {
					...wafStatus.config,
					...camelize( config ),
				},
			} ) );

			return { initialValue };
		},
		onSuccess: () => {
			showSuccessNotice( __( 'Changes saved.', 'jetpack-protect' ) );
		},
		onError: ( error, variables, context ) => {
			// Reset the WAF config to its previous state.
			queryClient.setQueryData( [ QUERY_WAF_KEY ], context.initialValue );

			showErrorNotice( getCustomErrorMessage( error ) );
		},
	} );
}
