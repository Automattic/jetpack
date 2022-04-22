/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * Internal dependencies
 */
import CompactFormToggle from 'components/form-toggle/compact';

describe( 'CompactFormToggle', function () {
	const testProps = {
		className: 'test-class',
	};
	describe( 'rendering', function () {
		it( 'can render', () => {
			render( <CompactFormToggle>Toggle Label</CompactFormToggle> );
			expect( screen.queryByText( 'Toggle Label' ) ).toBeInTheDocument();
			expect( screen.getAllByRole( 'checkbox' )[ 0 ].className ).toContain( 'is-compact' );
		} );

		it( 'can render with class name passed in', () => {
			render( <CompactFormToggle { ...testProps }>Toggle Label</CompactFormToggle> );
			expect( screen.getAllByRole( 'checkbox' )[ 0 ].className ).toContain( 'test-class' );
		} );
	} );
} );
