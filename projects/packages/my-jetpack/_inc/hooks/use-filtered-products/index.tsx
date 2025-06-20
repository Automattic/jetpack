import { useCallback, useEffect, useState } from 'react';
import useProductsByOwnership from '../../data/products/use-products-by-ownership';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';

/**
 * Hook for loading and filtering Jetpack products.
 *
 * @return {object} Object containing filtered products and loading state
 */
const useFilteredProducts = () => {
	const {
		data: { ownedProducts, unownedProducts },
		isLoading,
	} = useProductsByOwnership();

	const [ isLoadingProducts, setIsLoadingProducts ] = useState( true );
	const { canUserViewStats } = getMyJetpackWindowInitialState();

	useEffect( () => {
		if ( isLoading ) {
			return;
		}

		// This adds a slight delay to the loading status change to prevent
		// a brief moment in time where the section was not visible at all
		// between the isLoading = true and isLoading = false states.
		// This issue was causing a flicker effect.
		requestAnimationFrame( () => setIsLoadingProducts( false ) );
	}, [ isLoading ] );

	const filterProducts = useCallback(
		( products: JetpackModule[] ) => {
			const productsWithNoCard = [
				'extras',
				'scan',
				'security',
				'ai',
				'creator',
				'growth',
				'complete',
				'site-accelerator',
				'newsletter',
				'related-posts',
				'brute-force',
			];

			// If the user cannot view stats, filter out the stats card
			if ( ! canUserViewStats ) {
				productsWithNoCard.push( 'stats' );
			}

			return products.filter( product => {
				return ! productsWithNoCard.includes( product );
			} );
		},
		[ canUserViewStats ]
	);

	const filteredOwnedProducts = filterProducts( ownedProducts );
	const filteredUnownedProducts = filterProducts( unownedProducts );

	return {
		filteredOwnedProducts,
		filteredUnownedProducts,
		isLoading: isLoading || isLoadingProducts,
	};
};

export default useFilteredProducts;
