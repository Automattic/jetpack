import { registerStore } from '@wordpress/data';
import * as actions from './actions';
import applyMiddlewares from './middlewares';
import reducer from './reducer';
import * as selectors from './selectors';

const store = registerStore( 'jetpack/story/player', {
	actions,
	reducer,
	selectors,
} );

applyMiddlewares( store );

export default store;
