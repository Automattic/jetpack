import { useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_DISMISS_FEATURES_BANNER_KEY, REST_API_DISMISS_FEATURES_BANNER } from './constants';
import useSimpleMutation from './use-simple-mutation';
import { getMyJetpackWindowInitialState } from './utils/get-my-jetpack-window-state';

const DISMISSED_QUERY_KEY = [ 'my-jetpack-features-banner-dismissed' ];

const wasDismissedAtLoad = () =>
	getMyJetpackWindowInitialState( 'featuresBanner' )?.isDismissed === true;

/**
 * Whether the current user dismissed the Features tab banner, and a way to dismiss it for good.
 *
 * The flag lives in the query cache, seeded from the page's initial state, so a dismissal
 * outlives the banner unmounting when the user switches tabs.
 *
 * @return The dismissed flag and the `dismiss` function.
 */
export default function useFeaturesBannerDismissal() {
	const queryClient = useQueryClient();

	const { data: isDismissed } = useQuery( {
		queryKey: DISMISSED_QUERY_KEY,
		queryFn: wasDismissedAtLoad,
		initialData: wasDismissedAtLoad,
		staleTime: Infinity,
	} );

	const { mutate: dismiss } = useSimpleMutation( {
		name: QUERY_DISMISS_FEATURES_BANNER_KEY,
		query: {
			path: REST_API_DISMISS_FEATURES_BANNER,
			method: 'POST',
		},
		options: {
			onMutate: () => queryClient.setQueryData( DISMISSED_QUERY_KEY, true ),
			onError: () => queryClient.setQueryData( DISMISSED_QUERY_KEY, false ),
		},
	} );

	return { isDismissed, dismiss };
}
