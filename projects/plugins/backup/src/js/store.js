/**
 * Internal dependencies
 */
import reducer from './reducers';
import actions from './actions';
import selectors from './selectors';

export const STORE_ID = 'jetpack-backup-plugin';
export const storeConfig = {
	reducer,
	actions,
	selectors,
	initialState: window.JPBACKUP_INITIAL_STATE || {},
};
