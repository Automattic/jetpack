import { Container, Col } from '@automattic/jetpack-components';
import { useCallback, useEffect, useState } from 'react';
import useProductsByOwnership from '../../data/products/use-products-by-ownership';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import ProductsTableView from '../products-table-view';
import type { FC, ReactNode } from 'react';

interface UnownedProductsCardProps {
	noticeMessage?: ReactNode;
}

const UnownedProductsCard: FC< UnownedProductsCardProps > = ( { noticeMessage } ) => {
	const {
		data: { unownedProducts },
		isLoading,
	} = useProductsByOwnership();

	const [ isLoadingProducts, setIsLoadingProducts ] = useState( true );

	useEffect( () => {
		if ( isLoading ) {
			return;
		}

		// This adds a slight delay to the loading status change to prevent
		// a brief moment in time where the section was not visible at all
		// between the isLoading = true and isLoading = false states.
		// This issue was causing a flicker effect.
		requestAnimationFrame( () => setIsLoadingProducts( false ) );
	} );

	const { canUserViewStats, userIsAdmin } = getMyJetpackWindowInitialState();

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

	const filteredUnownedProducts = filterProducts( unownedProducts );

	if ( isLoading || isLoadingProducts ) {
		return <div>Loading...</div>;
	}

	return (
		userIsAdmin &&
		filteredUnownedProducts.length > 0 && (
			<Container horizontalSpacing={ 6 } horizontalGap={ noticeMessage ? 3 : 6 }>
				<Col>
					<ProductsTableView products={ filteredUnownedProducts } />
				</Col>
			</Container>
		)
	);
};

export default UnownedProductsCard;
