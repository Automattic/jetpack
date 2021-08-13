/**
 * Internal dependencies
 */
import reducer from './reducers';
import actions from './actions';
import selectors from './selectors';

export const STORE_ID = '@automattic/jetpack-connection';
export const storeConfig = {
	reducer,
	actions,
	selectors,
};
