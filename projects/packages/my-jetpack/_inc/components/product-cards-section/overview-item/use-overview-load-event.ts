import { useEffect, useRef } from 'react';
import useProduct from '../../../data/products/use-product';
import useAnalytics from '../../../hooks/use-analytics';

/**
 * Record the product card load event once the data has loaded.
 *
 * @param {JetpackModuleWithCard} slug         - The product slug.
 * @param {boolean}               isLoading    - Whether the product's data is still loading.
 * @param {object}                [properties] - Extra event properties, as a card's `customLoadTracks`.
 */
const useOverviewLoadEvent = (
	slug: JetpackModuleWithCard,
	isLoading: boolean,
	properties?: Record< Lowercase< string >, unknown >
) => {
	const { detail } = useProduct( slug );
	const status = detail?.status;
	const { recordEvent } = useAnalytics();
	const hasRecordedLoad = useRef( false );

	useEffect( () => {
		if ( isLoading || ! status || hasRecordedLoad.current ) {
			return;
		}
		hasRecordedLoad.current = true;
		recordEvent( 'jetpack_myjetpack_product_card_load', { product: slug, status, ...properties } );
	}, [ isLoading, status, slug, recordEvent, properties ] );
};

export default useOverviewLoadEvent;
