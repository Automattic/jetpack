import { useCallback } from 'react';
import { useNavigate } from 'react-router';
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

			if ( document.referrer.includes( window.location.host ) ) {
				// Prevent default here to minimize page change within the My Jetpack app.
				event.preventDefault();
				// Navigate back in history.
				navigate( -1 );
			}
		},
		[ recordEvent, slug, navigate ]
	);

	return { onClickGoBack };
}
