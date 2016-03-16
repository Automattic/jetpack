import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';

import reducer from 'state/reducer';

export default createJetpackStore();

function createJetpackStore() {
	const finalCreateStore = compose(
		applyMiddleware( thunk ),
		typeof window === 'object' && typeof window.devToolsExtension !== 'undefined' ? window.devToolsExtension() : f => f
	)( createStore );
	return finalCreateStore( reducer );
}
