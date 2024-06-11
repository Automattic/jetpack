import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManageConnectionsModal } from '..';
import { setup } from '../../../utils/test-factory';

jest.mock( '../confirmation-form', () => ( {
	ConfirmationForm: () => <div>Confirmation Form</div>,
} ) );

describe( 'ManageConnectionsModal', () => {
	let stubSetKeyringResult, stubGetKeyringResult;

	beforeEach( () => {
		jest.clearAllMocks();
		( { stubSetKeyringResult, stubGetKeyringResult } = setup() );
	} );

	it( 'renders ServicesList when there is no keyringResult', () => {
		render( <ManageConnectionsModal /> );

		expect( screen.queryByText( 'Confirmation Form' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Manage Jetpack Social connections' ) ).toBeInTheDocument();
	} );

	it( 'renders ConfirmationForm when there is a keyringResult', () => {
		stubGetKeyringResult.mockReturnValue( { ID: 'facebook' } );

		render( <ManageConnectionsModal /> );

		expect( screen.getByText( 'Confirmation Form' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Connection confirmation' ) ).toBeInTheDocument();
	} );

	it( 'closes the modal and resets keyringResult when closeModal is called', async () => {
		const user = userEvent.setup();

		render( <ManageConnectionsModal /> );

		await user.click( screen.getByRole( 'button', { name: /close/i } ) );

		expect( stubSetKeyringResult ).toHaveBeenCalledWith( null );
	} );
} );
