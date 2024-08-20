import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect, useCallback } from '@wordpress/element';

/**
 * Custom hook to fetch and manage backup product pricing information.
 *
 * @return {object} An object containing the current product price and the price after any introductory offer.
 */
export function useBackupProductInfo() {
	const [ price, setPrice ] = useState( 0 );
	const [ priceAfter, setPriceAfter ] = useState( 0 );

	const fetchBackupProductInfo = useCallback( () => {
		return apiFetch( { path: '/jetpack/v4/backup-promoted-product-info' } );
	}, [] );

	useEffect( () => {
		fetchBackupProductInfo().then( res => {
			setPrice( res.cost / 12 );
			if ( res.introductory_offer ) {
				setPriceAfter( res.introductory_offer.cost_per_interval / 12 );
			} else {
				setPriceAfter( res.cost / 12 );
			}
		} );
	}, [ fetchBackupProductInfo ] );

	return { price, priceAfter };
}
