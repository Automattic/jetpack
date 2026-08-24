import { useQueryClient } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import {
	QUERY_DISMISS_A4A_BANNER_KEY,
	QUERY_GET_JETPACK_MANAGE_DATA_KEY,
	REST_API_DISMISS_A4A_BANNER,
	REST_API_GET_JETPACK_MANAGE_DATA,
} from './constants';
import useSimpleMutation from './use-simple-mutation';
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

	const { mutate, isPending } = useSimpleMutation( {
		name: QUERY_DISMISS_A4A_BANNER_KEY,
		query: {
			path: REST_API_DISMISS_A4A_BANNER,
			method: 'POST',
		},
		errorMessage: __(
			'There was a problem dismissing the Automattic for Agencies banner.',
			'jetpack-my-jetpack'
		),
	} );

	const dismiss = useCallback( () => {
		// Mark the cached payload dismissed before firing the request. Leaving it stale means that
		// navigating away from the Overview tab and back re-renders the banner from cache until the
		// refetch lands — visibly, and firing a second `banner_view` event for a banner the user
		// has already dismissed. `useSimpleQuery` keys on [ name, query ], so this must match.
		queryClient.setQueryData(
			[ QUERY_GET_JETPACK_MANAGE_DATA_KEY, { path: REST_API_GET_JETPACK_MANAGE_DATA } ],
			( data: JetpackManageData | undefined ) => ( data ? { ...data, isDismissed: true } : data )
		);

		mutate();
	}, [ mutate, queryClient ] );

	return { dismiss, isPending };
}
