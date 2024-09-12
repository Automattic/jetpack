/**
 * WordPress dependencies
 */
import { createReduxStore, register } from '@wordpress/data';
/**
 * Internal dependencies
 */
import * as actions from './actions';
import reducer from './reducer';
import * as selectors from './selectors';

const STORE_NAME = 'jetpack/ai-breve';

export const store = createReduxStore( STORE_NAME, {
	reducer,
	selectors,
	actions,
} );

register( store );
