/**
 * External dependencies
 */
import { registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import * as actions from './actions';
import * as selectors from './selectors';
import reducer from './reducer';

export const jetpackMembershipProductsStore = 'jetpack/membership-products';

const store = registerStore( jetpackMembershipProductsStore, {
	actions,
	reducer,
	selectors,
} );

export default store;
