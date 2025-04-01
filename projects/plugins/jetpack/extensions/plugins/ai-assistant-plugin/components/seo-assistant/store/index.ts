/**
 * External dependencies
 */
import { createReduxStore, register } from '@wordpress/data';
/**
 * Internal dependencies
 */
import * as actions from './actions';
import reducer from './reducer';
import * as selectors from './selectors';

export const STORE_NAME = 'jetpack/seo-assistant';

export const store = createReduxStore( STORE_NAME, {
	reducer,
	selectors,
	actions,
	initialState: {
		isOpen: false,
	},
} );

register( store );
