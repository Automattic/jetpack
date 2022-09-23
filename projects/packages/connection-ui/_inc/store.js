import reducer from './reducers';
import selectors from './selectors';

export const STORE_ID = 'jetpack-connection-ui';
export const storeConfig = {
	reducer,
	selectors,
	initialState: window.CUI_INITIAL_STATE || {},
};
