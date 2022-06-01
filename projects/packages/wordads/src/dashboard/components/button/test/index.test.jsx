/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from 'components/button';
import React from 'react';

describe( 'Button', function () {
	const testProps = {
		className: 'test-class',
	};
	it( 'can render', () => {
		render( <Button /> );
		expect( screen.queryByRole( 'button' ) ).toBeInTheDocument();
	} );
	it( 'can render compact button', () => {
		render( <Button compact={ true } /> );
		expect( screen.queryByRole( 'button' ).className ).toContain( 'is-compact' );
	} );
	it( 'can render with class name passed in', () => {
		render( <Button { ...testProps } /> );
		expect( screen.queryByRole( 'button' ).className ).toContain( 'test-class' );
	} );
} );
