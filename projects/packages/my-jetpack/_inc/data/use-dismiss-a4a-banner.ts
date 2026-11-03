import { useQueryClient } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import {
	JETPACK_MANAGE_DATA_QUERY,
	QUERY_DISMISS_A4A_BANNER_KEY,
	REST_API_DISMISS_A4A_BANNER,
} from './constants';
import useSimpleMutation from './use-simple-mutation';
import { getSimpleQueryKey } from './use-simple-query';
import type { JetpackManageData } from './types';

/**
 * Dismiss the Automattic for Agencies banner for this site.
 *
 * POSTs to `/my-jetpack/v1/jetpack-manage/dismiss-banner`, which persists the dismissal so the
 * banner stays hidden on subsequent page loads. The dismissal is deliberately stored per site
 * rather than per user, so dismissing it here hides the banner for every admin on the site.
 *
 * @return The mutation result, exposing `dismiss` (the mutate fn) and its `isPending` state.
 */
export default function useDismissA4ABanner() {
	const queryClient = useQueryClient();
	const manageDataKey = getSimpleQueryKey( JETPACK_MANAGE_DATA_QUERY );

	const { mutate: dismiss, isPending } = useSimpleMutation( {
		name: QUERY_DISMISS_A4A_BANNER_KEY,
		query: {
			path: REST_API_DISMISS_A4A_BANNER,
			method: 'POST',
		},
		options: {
			// Mark the cached payload dismissed up front rather than on success. Leaving it stale
			// means navigating away from the Overview tab and back re-renders the banner from
			// cache until the refetch lands — visibly, and firing a second `banner_view` for a
			// banner the user has already dismissed.
			onMutate: () => {
				const previous = queryClient.getQueryData< JetpackManageData >( manageDataKey );

				queryClient.setQueryData( manageDataKey, ( data: JetpackManageData | undefined ) =>
					data ? { ...data, isDismissed: true } : data
				);

				return { previous };
			},
			// The banner is only actually dismissed if the request lands, so put the cache back
			// when it doesn't — otherwise the UI keeps claiming a dismissal that never persisted.
			onError: ( _error, _variables, context: { previous?: JetpackManageData } ) => {
				if ( context?.previous ) {
					queryClient.setQueryData( manageDataKey, context.previous );
				}
			},
		},
		errorMessage: __(
			'There was a problem dismissing the Automattic for Agencies banner.',
			'jetpack-my-jetpack'
		),
	} );

	return { dismiss, isPending };
}
