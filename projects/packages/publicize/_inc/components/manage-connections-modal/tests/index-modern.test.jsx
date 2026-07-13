import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setup } from '../../../utils/test-factory';
import { ModernManageConnectionsModal } from '../index-modern';

jest.mock( '../confirmation-form', () => ( {
	ConfirmationForm: () => <div>Confirmation Form</div>,
} ) );
jest.mock( '../../services/services-list-modern', () => ( {
	ModernServicesList: () => <div>Services List</div>,
} ) );
jest.mock( '../../../hooks/use-user-can-share-connection', () => ( {
	useUserCanShareConnection: jest.fn( () => true ),
} ) );

describe( 'ModernManageConnectionsModal', () => {
	let stubSetKeyringResult, stubGetKeyringResult;

	beforeEach( () => {
		jest.clearAllMocks();
		( { stubSetKeyringResult, stubGetKeyringResult } = setup() );
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	} );

	// The Dialog/Tooltip primitives schedule async positioning effects after
	// mount, so flush them inside act before asserting.
	const renderModal = async () => {
		render( <ModernManageConnectionsModal /> );
		// Settle the floating-ui/tooltip effects (some resolve via microtasks,
		// some via timers) so no state update escapes act.
		await act( async () => {
			await Promise.resolve();
			jest.runAllTimers();
		} );
		await act( async () => {
			jest.runAllTimers();
		} );
	};

	it( 'renders the services list in a dialog when there is no keyringResult', async () => {
		await renderModal();

		expect( screen.queryByText( 'Confirmation Form' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Services List' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Manage Jetpack Social connections' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
	} );

	it( 'renders the ConfirmationForm when there is a keyringResult', async () => {
		stubGetKeyringResult.mockReturnValue( { ID: 'facebook' } );

		await renderModal();

		expect( screen.getByText( 'Confirmation Form' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Connection confirmation' ) ).toBeInTheDocument();
	} );

	it( 'resets the keyring result when the dialog is closed', async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );

		await renderModal();

		await user.click( screen.getByRole( 'button', { name: /close/i } ) );

		// Dialog has a close animation. Wait for it to finish.
		await act( () => {
			jest.runAllTimers();
		} );

		expect( stubSetKeyringResult ).toHaveBeenCalledWith( null );
	} );
} );
