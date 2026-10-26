import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { MyJetpackRoutes } from '../../constants';
import { useValueStore } from '../../context/value-store/valueStoreContext';
import useAnalytics from '../use-analytics';
import type { MouseEvent } from 'react';

/**
 * Custom React hook to handle back link click with analytics.
 *
 * Goes back in history when a My Jetpack tab was shown earlier on this page visit or the
 * page came from an allowed site; otherwise goes to `fallback`.
 *
 * @param options          - Options.
 * @param options.slug     - Product slug, recorded with the analytics event.
 * @param options.fallback - Route used when no tab was shown. Defaults to the My Jetpack home (`/`).
 * @return Object with the back link destination and its click handler with analytics.
 */
export function useGoBack( {
	slug,
	fallback = MyJetpackRoutes.Home,
}: {
	slug: string;
	fallback?: string;
} ) {
	const { recordEvent } = useAnalytics();
	const navigate = useNavigate();
	const [ lastTabPath ] = useValueStore( 'lastTabPath', null );
	const backTo = lastTabPath ?? fallback;

	const onClickGoBack = useCallback(
		( event: MouseEvent ) => {
			if ( slug ) {
				recordEvent( 'jetpack_myjetpack_product_interstitial_back_link_click', { product: slug } );
			}

			event.preventDefault();

			// A tab shown earlier on this page visit is still behind us in history.
			if ( lastTabPath ) {
				navigate( -1 );
				return;
			}

			// Check if referrer is from allowed sites (current site, wordpress.com, jetpack.com)
			const allowedReferrers = [
				window.location.host, // Current site (internal navigation)
				'wordpress.com', // WordPress.com auth/management
				'jetpack.com', // Jetpack.com documentation/links
			];

			let referrerHostname = '';
			try {
				referrerHostname = new URL( document.referrer ).hostname;
			} catch {
				// If referrer is not a valid URL, leave referrerHostname as an empty string
			}

			const isFromAllowedSite = allowedReferrers.includes( referrerHostname );
			if ( isFromAllowedSite && window.history.length > 1 ) {
				navigate( -1 );
			} else {
				navigate( backTo );
			}
		},
		[ slug, recordEvent, navigate, lastTabPath, backTo ]
	);

	return { onClickGoBack, backTo };
}
