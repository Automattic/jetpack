/**
 * Internal dependencies
 */
import reducer from './reducer';
import actions from './actions';
import selectors from './selectors';
import resolvers from './resolvers';
import controls from './controls';

export const STORE_ID = 'jetpack-search-plugin';
export const storeConfig = {
	reducer,
	actions,
	selectors,
	resolvers,
	controls,
	initialState: window.JETPACK_SEARCH_DASHBOARD_INITIAL_STATE || {},
};
