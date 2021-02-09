/**
 * Internal dependencies
 */
import reducer from './reducers';
import actions from './actions';
import selectors from './selectors';

export const STORE_ID = 'jetpack-connection-ui';
export const storeConfig = {
	reducer,
	actions,
	selectors,
	initialState: window.CUI_INITIAL_STATE || {},
};
