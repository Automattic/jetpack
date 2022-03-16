/**
 * External dependencies
 */
import { registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import * as actions from './actions';
import reducer from './reducer';
import * as resolvers from './resolvers';
import * as selectors from './selectors';

export const jetpackMembershipProductsStore = 'jetpack/membership-products';

const store = registerStore( jetpackMembershipProductsStore, {
	actions,
	reducer,
	resolvers,
	selectors,
} );

export default store;
