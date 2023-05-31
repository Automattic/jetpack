import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Rating } from '../edit';

describe( 'Rating', () => {
	const setRatingMock = jest.fn();
	const defaultProps = {
		id: 1,
		setRating: setRatingMock,
		children: [ <p key="yo">Things are just fine!</p> ],
	};

	beforeEach( () => {
		setRatingMock.mockClear();
	} );

	test( 'loads and displays children', () => {
		render( <Rating { ...defaultProps } /> );
		expect( screen.getByText( 'Things are just fine!' ) ).toBeInTheDocument();
	} );

	test( 'fires click event handler callbacks', async () => {
		const user = userEvent.setup();
		render( <Rating { ...defaultProps } /> );
		await user.click( screen.getByRole( 'button' ) );
		expect( setRatingMock ).toHaveBeenCalledTimes( 1 );
		expect( setRatingMock ).toHaveBeenCalledWith( defaultProps.id );
	} );

	test( 'fires keydown event handler callbacks', async () => {
		const user = userEvent.setup();
		render( <Rating { ...defaultProps } /> );
		await user.type( screen.getByRole( 'button' ), '{enter}' );
		// A focused keypress event fires both keydown and click so we expect two executions
		expect( setRatingMock ).toHaveBeenCalledTimes( 2 );
		expect( setRatingMock.mock.calls[ 0 ][ 0 ] ).toBe( defaultProps.id );
		expect( setRatingMock.mock.calls[ 1 ][ 0 ] ).toBe( defaultProps.id );
	} );
} );
