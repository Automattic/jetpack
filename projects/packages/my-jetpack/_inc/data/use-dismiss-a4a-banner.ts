import { __ } from '@wordpress/i18n';
import { QUERY_DISMISS_A4A_BANNER_KEY, REST_API_DISMISS_A4A_BANNER } from './constants';
import useSimpleMutation from './use-simple-mutation';

type DismissA4ABannerResponse = {
	success: boolean;
};

/**
 * Dismiss the Automattic for Agencies banner for this site.
 *
 * POSTs to `/my-jetpack/v1/jetpack-manage/dismiss-banner`, which persists the dismissal so the
 * banner stays hidden on subsequent page loads. The dismissal is site-wide rather than per-user,
 * matching the welcome banner.
 *
 * @return The mutation result, exposing `dismiss` (the mutate fn) and its `isPending` state.
 */
export default function useDismissA4ABanner() {
	const { mutate: dismiss, isPending } = useSimpleMutation< DismissA4ABannerResponse >( {
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

	return { dismiss, isPending };
}
