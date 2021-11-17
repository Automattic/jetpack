/**
 * External dependencies
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * Internal dependencies
 */
import Button from 'components/button';

describe( 'Button', function () {
	const testProps = {
		className: 'test-class',
	};
	describe( 'rendering', function () {
		it( 'should render', () => {
			render( <Button /> );
			expect( screen.queryByRole( 'button' ) ).toBeInTheDocument();
		} );
	} );
	describe( 'can render compact button', function () {
		it( 'should render', () => {
			render( <Button compact={ true } /> );
			expect( screen.queryByRole( 'button' ).className ).toContain( 'is-compact' );
		} );
	} );
	it( 'should render class name passed in', () => {
		render( <Button { ...testProps } /> );
		expect( screen.queryByRole( 'button' ).className ).toContain( 'test-class' );
	} );
} );
