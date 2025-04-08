import { useEffect } from 'react';
import { useValueStore } from '../../context/value-store/valueStoreContext';
import {
	QUERY_PRODUCT_BY_OWNERSHIP_KEY,
	REST_API_SITE_PRODUCTS_OWNERSHIP_ENDPOINT,
} from '../constants';
import useSimpleQuery from '../use-simple-query';

// Create query to fetch new product data from the server
const useFetchProductsByOwnership = () => {
	const queryResult = useSimpleQuery<
		Record< 'ownedProducts' | 'unownedProducts', JetpackModule[] >
	>( {
		name: `${ QUERY_PRODUCT_BY_OWNERSHIP_KEY }`,
		query: {
			path: REST_API_SITE_PRODUCTS_OWNERSHIP_ENDPOINT,
		},
	} );

	return queryResult;
};

const useProductsByOwnership = () => {
	const [ productsOwnership, setProductsOwnership ] = useValueStore( 'productsOwnership', {
		ownedProducts: [],
		unownedProducts: [],
	} );

	const { data, refetch, isLoading } = useFetchProductsByOwnership();

	useEffect( () => {
		if ( ! isLoading && data ) {
			const { ownedProducts = [], unownedProducts = [] } = data;
			setProductsOwnership( { ownedProducts, unownedProducts } );
		}
	}, [ data, isLoading, setProductsOwnership ] );

	return {
		refetch,
		data: productsOwnership,
		isLoading,
	};
};

export default useProductsByOwnership;
