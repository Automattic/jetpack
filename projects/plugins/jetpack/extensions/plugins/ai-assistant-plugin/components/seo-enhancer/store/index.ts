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

export const STORE_NAME = 'jetpack/seo-enhancer';

export const store = createReduxStore( STORE_NAME, {
	reducer,
	selectors,
	actions,
	initialState: {
		isBusy: false,
	},
} );

register( store );
