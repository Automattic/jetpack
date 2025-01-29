import { getMyJetpackWindowInitialState } from '../utils/get-my-jetpack-window-state';
import { prepareProductData } from '../utils/prepare-product-data';
import type { ProductCamelCase } from '../types';

export const useAllProducts = (): { [ key: string ]: ProductCamelCase } => {
	const { items: products } = getMyJetpackWindowInitialState( 'products' );

	if ( ! products ) {
		return {};
	}

	return Object.entries( products ).reduce(
		( acc, [ key, product ] ) => ( { ...acc, [ key ]: prepareProductData( product ) } ),
		{}
	);
};
