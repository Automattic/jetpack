/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import ImageCompareControls from '../controls';

describe( 'ImageCompareControls', () => {
	const setAttributes = jest.fn();
	const defaultProps = {
		attributes: { orientation: undefined },
		setAttributes,
	};

	beforeEach( () => {
		setAttributes.mockClear();
	} );

	test( 'loads and displays orientation controls', () => {
		render( <ImageCompareControls { ...defaultProps } /> );

		expect( screen.getByText( 'Orientation' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Side by side' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Above and below' ) ).toBeInTheDocument();
	} );

	test( 'defaults orientation selection to horizontal', () => {
		render( <ImageCompareControls { ...defaultProps } /> );

		expect( screen.getByLabelText( 'Side by side' ) ).toHaveAttribute( 'checked' );
	} );

	test( 'selects option according to orientation attribute', () => {
		const attributes = { orientation: 'vertical' };
		render( <ImageCompareControls { ...{ ...defaultProps, attributes } } /> );

		expect( screen.getByLabelText( 'Above and below' ) ).toHaveAttribute( 'checked' );
	} );

	test( 'sets the orientation attribute ', () => {
		render( <ImageCompareControls { ...defaultProps } /> )
		userEvent.click( screen.getByLabelText( 'Above and below' ) );

		expect( setAttributes ).toHaveBeenCalledWith( { orientation: 'vertical' } );
	} );
} );
