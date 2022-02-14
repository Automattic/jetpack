/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../state/store';
import { mapObjectKeysToCamel } from '../../utils/to-camel';

/**
 * React custom hook that exposes data about Product,
 * as well as methods to manipulate it.
 *
 * @param {string} productId - My Jetpack product ID.
 * @returns {object}         - Site product data.
 */
export function useProduct( productId ) {
	const { activateProduct, deactivateProduct } = useDispatch( STORE_ID );

	/*
	 * Re map object keys to camel case.
	 * Consider to improve this in the process.
	 */
	let detail = useSelect( select => select( STORE_ID ).getProduct( productId ) );
	detail = mapObjectKeysToCamel( detail, true );
	detail.pricingForUi = mapObjectKeysToCamel( detail.pricingForUi, true );

	// Features
	detail.features = detail.features || [];

	// Supported products.
	detail.supportedProducts = detail.supportedProducts || [];

	// Pricinf for UI.
	detail.pricingForUi = detail.pricingForUi || {};
	const { fullPrice, promotionPercentage } = detail.pricingForUi;
	detail.pricingForUi.discountedPrice = ( fullPrice * ( 100 - promotionPercentage ) ) / 100;

	return {
		activate: () => activateProduct( productId ),
		deactivate: () => deactivateProduct( productId ),
		productsList: useSelect( select => select( STORE_ID ).getProducts() ),
		detail,
		isActive: detail.status === 'active',
		isFetching: useSelect( select => select( STORE_ID ).isFetching( productId ) ),
		status: detail.status, // shorthand. Consider to remove.
	};
}
