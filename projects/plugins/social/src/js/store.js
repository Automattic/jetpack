/**
 * Internal dependencies
 */
import reducer from './reducers';
import selectors from './selectors';

export const STORE_ID = 'jetpack-social-plugin';
export const storeConfig = {
	reducer,
	selectors,
	initialState: window.JPSOCIAL_INITIAL_STATE || {},
};
