import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PinterestBlockControls } from '../controls';

describe( 'PinterestBlockControls', () => {
	const setEditingState = jest.fn();

	const defaultProps = {
		setEditingState,
	};

	beforeEach( () => {
		setEditingState.mockClear();
	} );

	test( 'calls setEditingState when clicking edit icon', async () => {
		const user = userEvent.setup();
		render( <PinterestBlockControls { ...defaultProps } /> );
		await user.click( screen.getByRole( 'button' ) );
		expect( setEditingState ).toHaveBeenCalledWith( true );
	} );
} );
