import * as React from 'react';
import { expect } from 'chai';

import Search  from '../search';
import { buildInitialState } from './fixtures';
import { render, screen, within } from 'test/test-utils';

describe.only( 'Performance tab', () => {
	it( "shows Jetpack Search Widget button if theme supports it", () => {
		render( <Search />, {
			initialState: buildInitialState( { themeSupportsWidgets: true } ),
		} );

		expect( screen.getByText( 'Add Jetpack Search Widget' ) ).to.be.not.null;
	} );

	it( "hides Jetpack Search Widget button if theme does not support it", () => {
		render( <Search />, {
			initialState: buildInitialState( { themeSupportsWidgets: false } ),
		} );

		expect( screen.queryByText( 'Add Jetpack Search Widget' ) ).to.be.null;
	} );
} );
