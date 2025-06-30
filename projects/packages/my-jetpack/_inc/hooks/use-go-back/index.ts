import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { MyJetpackRoutes } from '../../constants';
import useAnalytics from '../use-analytics';

/**
 * Custom React hook to handle back link click with analytics.
 *
 * @param {{ slug: string }} options - Options.
 * @return Object with back link click handler with analytics.
 */
export function useGoBack( { slug }: { slug: string } ) {
	const { recordEvent } = useAnalytics();
	const navigate = useNavigate();

	const onClickGoBack = useCallback(
		( event: React.MouseEvent ) => {
			if ( slug ) {
				recordEvent( 'jetpack_myjetpack_product_interstitial_back_link_click', { product: slug } );
			}

			event.preventDefault();

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
				navigate( MyJetpackRoutes.Home );
			}
		},
		[ slug, recordEvent, navigate ]
	);

	return { onClickGoBack };
}
