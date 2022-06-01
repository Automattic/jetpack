import * as React from 'react';
import { expect } from 'chai';

import { ProductSuggestions } from '../index';
import { buildInitialState } from './fixtures';
import { render, screen } from 'test/test-utils';

describe( 'Recommendations – Product Suggestions', () => {
	it( 'shows the Product Suggestions component', () => {
		render( <ProductSuggestions />, {
			initialState: buildInitialState(),
		} );

		// Make sure we display all static data.
		expect( screen.getAllByText( '14-day money-back guarantee' ) ).to.be.not.null;

		// Verify that we display both recommendations.
		expect( screen.getAllByText( 'Backup Daily' ) ).to.be.not.null;
		expect( screen.getAllByText( 'Security Daily' ) ).to.be.not.null;
	} );
} );
