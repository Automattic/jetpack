/**
 * External dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../state/store';

export default () => {
	const { products } = useSelect( select => ( {
		products: select( STORE_ID ).getProducts(),
	} ) );

	return {
		products,
	};
};
