import * as React from 'react';
import { render, screen } from 'test/test-utils';
import { ProductSuggestions } from '../index';
import { buildInitialState } from './fixtures';

describe( 'Recommendations – Product Suggestions', () => {
	it( 'shows the Product Suggestions component', () => {
		render( <ProductSuggestions />, {
			initialState: buildInitialState(),
		} );

		// Make sure we display all static data.
		expect( screen.getByText( '14-day money-back guarantee' ) ).toBeInTheDocument();

		// Verify that we display both recommendations.
		expect( screen.getByText( 'Backup Daily' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Security Daily' ) ).toBeInTheDocument();
	} );
} );
