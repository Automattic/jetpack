/**
 * Internal dependencies
 */
import reducer from './reducer';
import actions from './actions';
import selectors from './selectors';
import resolvers from './resolvers';
import controls from './controls';

export const STORE_ID = 'jetpack-wordads-plugin';
export const storeConfig = {
	reducer,
	actions,
	selectors,
	resolvers,
	controls,
	initialState: window.WORDADS_DASHBOARD_INITIAL_STATE || {},
};
