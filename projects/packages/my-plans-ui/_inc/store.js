/**
 * Internal dependencies
 */
import reducer from './reducers';
import actions from './actions';
import selectors from './selectors';

export const STORE_ID = 'jetpack-my-plans-ui';
export const storeConfig = {
	reducer,
	actions,
	selectors,
	initialState: window.MPUI_INITIAL_STATE || {},
};
