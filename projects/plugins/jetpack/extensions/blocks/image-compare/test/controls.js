import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

		expect( screen.getByLabelText( 'Side by side' ) ).toBeChecked();
	} );

	test( 'selects option according to orientation attribute', () => {
		const attributes = { orientation: 'vertical' };
		render( <ImageCompareControls { ...{ ...defaultProps, attributes } } /> );

		expect( screen.getByLabelText( 'Above and below' ) ).toBeChecked();
	} );

	test( 'sets the orientation attribute', async () => {
		const user = userEvent.setup();
		render( <ImageCompareControls { ...defaultProps } /> );
		await user.click( screen.getByLabelText( 'Above and below' ) );

		expect( setAttributes ).toHaveBeenCalledWith( { orientation: 'vertical' } );
	} );
} );
