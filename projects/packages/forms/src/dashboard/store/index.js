// import { createStore, applyMiddleware, compose } from 'redux';
import { createReduxStore, register } from '@wordpress/data';
import * as actions from './actions';
import reducer from './reducer';
import * as resolvers from './resolvers';
import * as selectors from './selectors';

const STORE_NAME = 'FORM_RESPONSES';

export const store = createReduxStore( STORE_NAME, {
	actions,
	reducer,
	selectors,
	resolvers,
} );

register( store );
