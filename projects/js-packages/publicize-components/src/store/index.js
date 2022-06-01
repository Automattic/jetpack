import { registerStore } from '@wordpress/data';
import * as actions from './actions';
import controls from './controls';
import applyMiddlewares from './middlewares';
import reducer from './reducer';
import * as selectors from './selectors';

const store = registerStore( 'jetpack/publicize', {
	actions,
	controls,
	reducer,
	selectors,
} );

applyMiddlewares( store );

export default store;
