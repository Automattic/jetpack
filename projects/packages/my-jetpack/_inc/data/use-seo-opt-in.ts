import { __ } from '@wordpress/i18n';
import useAnalytics from '../hooks/use-analytics';
import { assignLocation } from '../hooks/use-notification-watcher/assignLocation';
import { REST_API_SEO_OPT_IN_ENDPOINT, QUERY_SEO_OPT_IN_KEY } from './constants';
import useSimpleMutation from './use-simple-mutation';
import { getMyJetpackWindowInitialState } from './utils/get-my-jetpack-window-state';

type SeoOptInResponse = {
	success: boolean;
	redirect: string;
};

/**
 * Opt the site into the new Jetpack SEO experience.
 *
 * POSTs to `/jetpack/v4/seo/opt-in`, which marks the SEO surface visible and activates the
 * `seo-tools` module, then returns the admin URL of the new SEO dashboard. On success the user is
 * sent to that URL. The endpoint is the source of truth for the destination; the bootstrapped
 * `seoOptIn.redirect` is only a fallback for an unexpected empty response.
 *
 * @return The mutation result, exposing `optIn` (the mutate fn) and its `isPending` state.
 */
export default function useSeoOptIn() {
	const { recordEvent } = useAnalytics();

	const { mutate: optIn, isPending } = useSimpleMutation< SeoOptInResponse >( {
		name: QUERY_SEO_OPT_IN_KEY,
		query: {
			path: REST_API_SEO_OPT_IN_ENDPOINT,
			method: 'POST',
		},
		options: {
			onSuccess: ( { redirect } ) => {
				recordEvent( 'jetpack_myjetpack_seo_opt_in_card_success', {} );

				const { redirect: fallbackRedirect } = getMyJetpackWindowInitialState( 'seoOptIn' );
				// Navigate via the wrapper so the redirect is mockable in tests
				// (window.location can't be stubbed under jsdom).
				assignLocation( redirect || fallbackRedirect );
			},
		},
		errorMessage: __(
			'There was a problem enabling the new SEO experience.',
			'jetpack-my-jetpack'
		),
	} );

	return { optIn, isPending };
}
