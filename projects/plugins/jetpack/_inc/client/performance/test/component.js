import * as React from 'react';
import { render, screen } from 'test/test-utils';
import Search from '../search';
import { buildInitialState } from './fixtures';

describe( 'Performance tab', () => {
	it( 'shows Jetpack Search Widget button if theme supports it', () => {
		render( <Search />, {
			initialState: buildInitialState( { themeSupportsWidgets: true } ),
		} );

		expect( screen.getByText( 'Add Jetpack Search Widget' ) ).toBeInTheDocument();
	} );

	it( 'hides Jetpack Search Widget button if theme does not support it', () => {
		render( <Search />, {
			initialState: buildInitialState( { themeSupportsWidgets: false } ),
		} );

		expect( screen.queryByText( 'Add Jetpack Search Widget' ) ).not.toBeInTheDocument();
	} );
} );
