import actions from './actions';
import reducer from './reducers';
import selectors from './selectors';
import storeHolder from './store-holder';

const STORE_ID = 'jetpack-idc';

storeHolder.mayBeInit( STORE_ID, {
	reducer,
	actions,
	selectors,
} );

export { STORE_ID };
