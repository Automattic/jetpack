/**
 * External dependencies
 */
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import { MyJetpackRoutes } from '../../constants';
import useAnalytics from '../use-analytics';
import useMyJetpackNavigate from '../use-my-jetpack-navigate';

/**
 * Custom React hook to handle back link click with analytics.
 *
 * @param {string} slug - My Jetpack product slug.
 * @return {object}      Object with back link click handler with analytics.
 */
export function useGoBack( { slug }: { slug: string } ) {
	const { recordEvent } = useAnalytics();
	const navigateToMyJetpackOverviewPage = useMyJetpackNavigate( MyJetpackRoutes.Home );

	const onClickGoBack = useCallback(
		( event: MouseEvent ) => {
			if ( slug ) {
				recordEvent( 'jetpack_myjetpack_product_interstitial_back_link_click', { product: slug } );
			}

			if ( document.referrer.includes( window.location.host ) ) {
				// Prevent default here to minimize page change within the My Jetpack app.
				event.preventDefault();
				navigateToMyJetpackOverviewPage();
			}
		},
		[ recordEvent, slug, navigateToMyJetpackOverviewPage ]
	);

	return { onClickGoBack };
}
