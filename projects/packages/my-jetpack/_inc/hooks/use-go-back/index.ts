/**
 * External dependencies
 */
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import useAnalytics from '../use-analytics';

/**
 * Custom React hook to handle back link click with analytics.
 *
 * @param {string} slug - My Jetpack product slug.
 * @returns {object}      Object with back link click handler with analytics.
 */
export function useGoBack( { slug }: { slug: string } ) {
	const { recordEvent } = useAnalytics();

	const onClickGoBack = useCallback(
		( event: MouseEvent ) => {
			if ( slug ) {
				recordEvent( 'jetpack_myjetpack_product_interstitial_back_link_click', { product: slug } );
			}

			if ( document.referrer.includes( window.location.host ) ) {
				// Prevent default here to minimize page change within the My Jetpack app.
				event.preventDefault();
				history.back();
			}
		},
		[ recordEvent, slug ]
	);

	return { onClickGoBack };
}
