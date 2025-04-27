/**
 * External dependencies
 */
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import Checkbox from '..';

describe( 'Checkbox', () => {
	it( 'renders correctly with default props', () => {
		render( <Checkbox /> );
		const checkbox = screen.getByRole( 'checkbox' );
		expect( checkbox ).toBeInTheDocument();
		expect( checkbox ).not.toBeChecked();
	} );

	it( 'renders with checked state', () => {
		render( <Checkbox checked={ true } /> );
		const checkbox = screen.getByRole( 'checkbox' );
		expect( checkbox ).toBeChecked();
	} );

	it( 'renders with children/label content', () => {
		const labelText = 'Test Label';
		render( <Checkbox>{ labelText }</Checkbox> );
		expect( screen.getByText( labelText ) ).toBeInTheDocument();
	} );

	it( 'calls onChange handler when clicked', async () => {
		const onChange = jest.fn();
		render( <Checkbox onChange={ onChange } /> );

		const checkbox = screen.getByRole( 'checkbox' );
		await userEvent.click( checkbox );

		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( onChange ).toHaveBeenCalledWith( true );
	} );

	it( 'forwards ref correctly', () => {
		const ref = createRef< HTMLInputElement >();
		render( <Checkbox ref={ ref } /> );

		expect( ref.current ).toBeInstanceOf( HTMLInputElement );
		expect( ref.current?.type ).toBe( 'checkbox' );
	} );

	it( 'applies custom className', () => {
		const customClass = 'custom-checkbox';
		render( <Checkbox className={ customClass } /> );

		const checkbox = screen.getByRole( 'checkbox' );
		expect( checkbox ).toHaveClass( customClass );
	} );

	it( 'handles htmlFor prop correctly', () => {
		const testId = 'test-checkbox';
		render( <Checkbox htmlFor={ testId } dataTestId="checkbox-label" /> );

		const label = screen.getByTestId( 'checkbox-label' );
		expect( label ).toHaveAttribute( 'for', testId );
	} );

	it( 'toggles checked state correctly', async () => {
		const onChange = jest.fn();
		const { rerender } = render( <Checkbox checked={ false } onChange={ onChange } /> );

		const checkbox = screen.getByRole( 'checkbox' );
		await userEvent.click( checkbox );
		expect( onChange ).toHaveBeenCalledWith( true );

		// Simulate parent updating the checked state
		rerender( <Checkbox checked={ true } onChange={ onChange } /> );
		await userEvent.click( checkbox );
		expect( onChange ).toHaveBeenLastCalledWith( false );
	} );

	it( 'maintains accessibility attributes', () => {
		render(
			<Checkbox
				aria-label="Test checkbox"
				aria-describedby="description"
				dataTestId="test-checkbox"
			/>
		);

		const checkbox = screen.getByRole( 'checkbox' );
		expect( checkbox ).toHaveAttribute( 'aria-label', 'Test checkbox' );
		expect( checkbox ).toHaveAttribute( 'aria-describedby', 'description' );
	} );
} );
