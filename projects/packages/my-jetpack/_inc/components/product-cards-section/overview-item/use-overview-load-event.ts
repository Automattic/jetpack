import { useEffect, useRef } from 'react';
import useProduct from '../../../data/products/use-product';
import useAnalytics from '../../../hooks/use-analytics';

/**
 * Record the product card load event once the data has loaded.
 *
 * @param {JetpackModuleWithCard} slug      - The product slug.
 * @param {boolean}               isLoading - Whether the product's data is still loading.
 */
const useOverviewLoadEvent = ( slug: JetpackModuleWithCard, isLoading: boolean ) => {
	const { detail } = useProduct( slug );
	const status = detail?.status;
	const { recordEvent } = useAnalytics();
	const hasRecordedLoad = useRef( false );

	useEffect( () => {
		if ( isLoading || ! status || hasRecordedLoad.current ) {
			return;
		}
		hasRecordedLoad.current = true;
		recordEvent( 'jetpack_myjetpack_product_card_load', { product: slug, status } );
	}, [ isLoading, status, slug, recordEvent ] );
};

export default useOverviewLoadEvent;
