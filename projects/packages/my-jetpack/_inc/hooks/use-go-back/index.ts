import { useCallback } from 'react';
import { MyJetpackRoutes } from '../../constants';
import { useValueStore } from '../../context/value-store/valueStoreContext';
import useAnalytics from '../use-analytics';

/**
 * Custom React hook to handle back link click with analytics.
 *
 * @param options          - Options.
 * @param options.slug     - Product slug, recorded with the analytics event.
 * @param options.fallback - Route to go back to when no My Jetpack tab was shown
 *                         before this screen. Defaults to the My Jetpack home (`/`).
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
	const [ lastTabPath ] = useValueStore( 'lastTabPath', null );

	const onClickGoBack = useCallback( () => {
		if ( slug ) {
			recordEvent( 'jetpack_myjetpack_product_interstitial_back_link_click', { product: slug } );
		}
	}, [ slug, recordEvent ] );

	return { onClickGoBack, backTo: lastTabPath ?? fallback };
}
