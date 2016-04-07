/**
 * External dependencies
 */
import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import { routerMiddleware } from 'react-router-redux';
import { hashHistory } from 'react-router';

/**
 * Internal dependencies
 */
import reducer from 'state/reducer';

const history = routerMiddleware( hashHistory );

export default createJetpackStore();

function createJetpackStore() {
	const finalCreateStore = compose(
		applyMiddleware( thunk ),
		applyMiddleware( history ),
		typeof window === 'object' && typeof window.devToolsExtension !== 'undefined' ? window.devToolsExtension() : f => f
	)( createStore );
	return finalCreateStore( reducer );
}
