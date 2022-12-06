import { createContext, useContext } from '@wordpress/element';
import { PRODUCT_TYPE_PAYMENT_PLAN } from './constants';

export const ProductManagementContext = createContext( {
	blockName: undefined,
	clientId: undefined,
	products: [],
	productType: PRODUCT_TYPE_PAYMENT_PLAN,
	selectedProductIds: 0,
	setSelectedProductIds: () => {},
} );

export const useProductManagementContext = () => useContext( ProductManagementContext );
