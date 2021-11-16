import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';

function doNothingReducer( state = {} ) {
	return state;
}

function render(
	ui,
	{
		initialState,
		reducer,
		store = createStore( reducer || doNothingReducer, initialState ),
		...renderOptions
	} = {}
) {
	function Wrapper( { children } ) {
		return <Provider store={ store }>{ children }</Provider>;
	}
	return rtlRender( ui, { wrapper: Wrapper, ...renderOptions } );
}

// re-export everything
export * from '@testing-library/react';

// override render method
export { render };
