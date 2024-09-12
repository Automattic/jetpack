import { createReduxStore, register } from '@wordpress/data';
import actions from './actions';
import reducer from './reducer';
import selectors from './selectors';

export const JETPACK_MEDIA_STORE = 'jetpack-media';

const storeConfig = {
	actions,
	reducer,
	selectors,
};

export const store = createReduxStore( JETPACK_MEDIA_STORE, storeConfig );

register( store );
