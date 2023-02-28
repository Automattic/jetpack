// import { createStore, applyMiddleware, compose } from 'redux';
import { createReduxStore, register } from '@wordpress/data';
import * as actions from './actions';
import controls from './controls';
import reducer from './reducer';
import resolvers from './resolvers';
import * as selectors from './selectors';

export const STORE_NAME = 'FORM_RESPONSES';

const storeConfig = {
	actions: { ...actions },
	reducer,
	selectors: { ...selectors },
	controls,
	resolvers,
};

console.log( storeConfig );
const store = createReduxStore( STORE_NAME, storeConfig );

register( store );
