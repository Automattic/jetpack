/**
 * Internal dependencies
 */
import reducer from './reducers';
import selectors from './selectors';

export const STORE_ID = 'jetpack-launchpad-plugin';
export const storeConfig = {
	reducer,
	selectors,
	initialState: window.JPLAUNCHPAD_INITIAL_STATE || {},
};
