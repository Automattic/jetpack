/**
 * External dependencies
 */
import { applyMiddleware, createStore } from 'redux';
import refx from 'refx';

/**
 * Internal dependencies
 */
import effects from './effects';
import reducer from './reducer';

if ( ! ( 'JETPACK_SEARCH_STORE' in window ) ) {
	window.JETPACK_SEARCH_STORE = createStore( reducer, [], applyMiddleware( refx( effects ) ) );
}

export default window.JETPACK_SEARCH_STORE;
