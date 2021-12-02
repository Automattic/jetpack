/**
 * Internal dependencies
 */
import reducer from './reducers';
import selectors from './selectors';

export const STORE_ID = 'jetpack-backup-plugin';
export const storeConfig = {
	reducer,
	selectors,
	initialState: window.JPBACKUP_INITIAL_STATE || {},
};
