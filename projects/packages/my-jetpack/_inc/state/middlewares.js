/**
 * External dependencies
 */
import refx from 'refx';
import { flowRight } from 'lodash';

/**
 * Applies the middlewares to the given store.
 *
 * @param {object} store   - Store Object.
 * @param {object} effects - Effects Object.
 * @returns {object} Update Store Object.
 */
export default function applyMiddlewares( store, effects ) {
	// Convert side-effect handler to middleware.
	const middlewares = [ refx( effects ) ];
	let enhancedDispatch = () => {
		throw new Error(
			'Dispatching while constructing your middleware is not allowed. ' +
				'Other middleware would not be applied to this dispatch.'
		);
	};
	let chain = [];

	const middlewareAPI = {
		getState: store.getState,
		dispatch: ( ...args ) => enhancedDispatch( ...args ),
	};
	chain = middlewares.map( middleware => middleware( middlewareAPI ) );
	enhancedDispatch = flowRight( ...chain )( store.dispatch );

	store.dispatch = enhancedDispatch;

	return store;
}
