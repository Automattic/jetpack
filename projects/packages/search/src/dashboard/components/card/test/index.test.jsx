/**
 * External dependencies
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * Internal dependencies
 */
import Card from 'components/card';

describe( 'Card', function () {
	describe( 'rendering', function () {
		it( 'should render', () => {
			render( <Card title="Title" /> );
			expect( screen.queryByRole( 'heading' ) ).toBeInTheDocument();
		} );
	} );
} );
