// @ts-nocheck - This isn't TypeScript, and tsc is dumb about the jsdoc `{...}` below.
import { render as rtlRender, RenderResult } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { Store, createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

/**
 * Reducer that does nothing.
 *
 * @param {object} state - Current state.
 * @returns {object} - New state, same as the old state.
 */
function doNothingReducer( state = {} ) {
	return state;
}

/**
 * Render a React element.
 *
 * @param {React.ReactElement} ui - React element to render.
 * @param {object} _ - Options.
 * @param {*} _.initialState - Initial Redux state.
 * @param {Function} _.reducer - Redux reducer.
 * @param {Store} _.store - Redux store. Overrides `initialState` and `reducer`.
 * @param {...} _.renderOptions - Additional options to pass to `@testing-library/react`'s `render()`.
 * @returns {RenderResult} - Render result.
 */
function render(
	ui,
	{
		initialState,
		reducer,
		store = createStore( reducer || doNothingReducer, initialState, applyMiddleware( thunk ) ),
		...renderOptions
	} = {}
) {
	const Wrapper = function ( { children } ) {
		return <Provider store={ store }>{ children }</Provider>;
	};
	return rtlRender( ui, { wrapper: Wrapper, ...renderOptions } );
}

// re-export everything
export * from '@testing-library/react';

// override render method
export { render };
