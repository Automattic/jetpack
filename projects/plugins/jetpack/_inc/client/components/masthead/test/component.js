import React from 'react';
import { render, screen } from 'test/test-utils';
import { Masthead } from '../index';

describe( 'Masthead', () => {
	it( 'finds selector .jp-masthead in main nav', () => {
		const { container } = render( <Masthead /> );
		// eslint-disable-next-line testing-library/no-container
		expect( container.querySelector( '.jp-masthead' ) ).toBeInTheDocument();
	} );

	it( 'does not display the Offline Mode badge when connected', () => {
		render( <Masthead /> );
		expect( screen.queryByText( 'Offline Mode', { selector: 'code' } ) ).not.toBeInTheDocument();
	} );

	it( 'displays the badge in Offline Mode', () => {
		render( <Masthead siteConnectionStatus="offline" /> );
		expect( screen.getByText( 'Offline Mode', { selector: 'code' } ) ).toBeInTheDocument();
	} );
} );
