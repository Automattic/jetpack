import { jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ESM test: static jest.mock does not work under --experimental-vm-modules, so mock the module
// with unstable_mockModule (must run before the dynamic import of the component below).
const mockFetchCandidates = jest.fn< () => Promise< unknown > >();
const mockRecordEvent = jest.fn();
const mockSetConnectionOwner = jest.fn< ( id: number ) => Promise< unknown > >();

jest.unstable_mockModule( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: mockRecordEvent }, initialize: jest.fn() },
} ) );

jest.unstable_mockModule( '@automattic/jetpack-api', () => ( {
	__esModule: true,
	default: {
		setApiRoot: jest.fn(),
		setApiNonce: jest.fn(),
		fetchConnectionOwnerCandidates: mockFetchCandidates,
		setConnectionOwner: mockSetConnectionOwner,
	},
} ) );

window.JP_CONNECTION_INITIAL_STATE = {
	hasProtectedOwner: false,
} as typeof window.JP_CONNECTION_INITIAL_STATE;

const { default: TransferConnectionOwnership } = await import( '../index' );

describe( 'TransferConnectionOwnership', () => {
	const props = {
		apiRoot: 'https://example.org/wp-json/',
		apiNonce: 'test-nonce',
	};

	const candidates = [
		{
			id: 7,
			login: 'kazz',
			displayName: 'Kazz',
			email: 'kazz@example.com',
			avatar: 'https://example.com/kazz.png',
		},
		{
			id: 9,
			login: 'alexm',
			displayName: 'Alex Moreno',
			email: 'alex@example.com',
			avatar: 'https://example.com/alex.png',
		},
	];

	// `checkStatus` throws an Error with the REST body on `response`, and its own
	// "… (Status 400)" text on `message`. Rejecting with the body alone would let a
	// component reading `err.code` pass while showing the raw server string in the browser.
	const apiError = ( code: string, message: string ) => {
		const error = new Error( `${ message } (Status 400)` );
		Object.assign( error, { name: 'ApiError', response: { code, message } } );
		return error;
	};

	const chooseKazz = async ( user: ReturnType< typeof userEvent.setup > ) => {
		await expect( screen.findByRole( 'option', { name: /Kazz/ } ) ).resolves.toBeInTheDocument();
		await user.selectOptions(
			screen.getByRole( 'combobox', { name: /New connection owner/ } ),
			'7'
		);
	};

	beforeEach( () => {
		jest.clearAllMocks();
		mockFetchCandidates.mockResolvedValue( candidates );
		mockSetConnectionOwner.mockResolvedValue( { code: 'success' } );
	} );

	it( 'lists the administrators who could take over', async () => {
		const user = userEvent.setup();
		render( <TransferConnectionOwnership { ...props } /> );

		await user.click( await screen.findByRole( 'combobox', { name: /New connection owner/ } ) );

		await expect(
			screen.findByRole( 'option', { name: 'Kazz (kazz@example.com)' } )
		).resolves.toBeInTheDocument();
		expect(
			screen.getByRole( 'option', { name: 'Alex Moreno (alex@example.com)' } )
		).toBeInTheDocument();
	} );

	it( 'chooses the only administrator there is', async () => {
		mockFetchCandidates.mockResolvedValue( [ candidates[ 0 ] ] );
		render( <TransferConnectionOwnership { ...props } /> );

		await waitFor( () =>
			expect( screen.getByRole( 'button', { name: 'Continue' } ) ).not.toHaveAttribute(
				'aria-disabled',
				'true'
			)
		);
		expect( screen.getByRole( 'combobox', { name: /New connection owner/ } ) ).toHaveTextContent(
			'Kazz'
		);
	} );

	it( 'cannot continue until somebody is chosen', async () => {
		render( <TransferConnectionOwnership { ...props } /> );
		await expect(
			screen.findByRole( 'combobox', { name: /New connection owner/ } )
		).resolves.toBeInTheDocument();

		// @wordpress/ui keeps disabled buttons focusable, so it marks them with aria-disabled.
		await expect( screen.findByRole( 'button', { name: 'Continue' } ) ).resolves.toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'confirms who is taking over before committing the transfer', async () => {
		const user = userEvent.setup();
		render( <TransferConnectionOwnership { ...props } /> );
		await chooseKazz( user );
		await user.click( screen.getByRole( 'button', { name: 'Continue' } ) );

		await expect(
			screen.findByText( /will become the connection owner/ )
		).resolves.toBeInTheDocument();
		expect( mockSetConnectionOwner ).not.toHaveBeenCalled();
	} );

	it( 'goes back to the chooser without transferring', async () => {
		const user = userEvent.setup();
		render( <TransferConnectionOwnership { ...props } /> );
		await chooseKazz( user );
		await user.click( screen.getByRole( 'button', { name: 'Continue' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Back' } ) );

		await expect(
			screen.findByRole( 'combobox', { name: /New connection owner/ } )
		).resolves.toBeInTheDocument();
		expect( mockSetConnectionOwner ).not.toHaveBeenCalled();
	} );

	it( 'keeps focus on a control when the step changes', async () => {
		const user = userEvent.setup();
		const { container } = render( <TransferConnectionOwnership { ...props } /> );
		const focused = () => container.ownerDocument.activeElement?.tagName;
		await chooseKazz( user );

		await user.click( screen.getByRole( 'button', { name: 'Continue' } ) );
		await expect(
			screen.findByRole( 'button', { name: 'Transfer ownership' } )
		).resolves.toBeInTheDocument();
		expect( focused() ).toBe( 'BUTTON' );

		await user.click( screen.getByRole( 'button', { name: 'Back' } ) );
		await expect(
			screen.findByRole( 'button', { name: 'Continue' } )
		).resolves.toBeInTheDocument();
		expect( focused() ).toBe( 'BUTTON' );
	} );

	it( 'reports the transfer as soon as it lands', async () => {
		const onTransferred = jest.fn();
		const user = userEvent.setup();
		render( <TransferConnectionOwnership { ...props } onTransferred={ onTransferred } /> );

		await chooseKazz( user );
		await user.click( screen.getByRole( 'button', { name: 'Continue' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Transfer ownership' } ) );

		await waitFor( () => expect( mockSetConnectionOwner ).toHaveBeenCalledWith( 7 ) );
		await waitFor( () => expect( onTransferred ).toHaveBeenCalledWith( 7 ) );

		// findAllBy: Notice also announces itself into the a11y-speak live region.
		await expect( screen.findAllByText( /is now the connection owner/ ) ).resolves.not.toHaveLength(
			0
		);
		// Leaving is the surrounding surface's business, so the step offers no way out.
		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );

	it( 'leaves the protected owner warning out when it does not apply', async () => {
		const user = userEvent.setup();
		render( <TransferConnectionOwnership { ...props } /> );

		await chooseKazz( user );
		await user.click( screen.getByRole( 'button', { name: 'Continue' } ) );

		await expect(
			screen.findByRole( 'button', { name: 'Transfer ownership' } )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( /protected owner of this connection/ ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[ 'new_owner_not_connected', /no longer connected to WordPress\.com/ ],
		[ 'new_owner_not_admin', /no longer an administrator/ ],
		[ 'new_owner_is_existing_owner', /already owns this connection/ ],
		[ 'ownership_locked', /locked and cannot be transferred/ ],
	] )( 'says why the transfer was refused: %s', async ( code, expected ) => {
		mockSetConnectionOwner.mockRejectedValue( apiError( code, 'Raw server text' ) );
		const user = userEvent.setup();
		render( <TransferConnectionOwnership { ...props } /> );
		await chooseKazz( user );
		await user.click( screen.getByRole( 'button', { name: 'Continue' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Transfer ownership' } ) );

		// findAllBy: the error Notice also announces itself into the a11y-speak region,
		// which is the point of it being a Notice.
		await expect( screen.findAllByText( expected ) ).resolves.not.toHaveLength( 0 );
	} );

	it( 'falls back to what the server said when the code is one we do not map', async () => {
		mockSetConnectionOwner.mockRejectedValue(
			apiError( 'error_setting_new_owner', 'Could not confirm new owner.' )
		);
		const user = userEvent.setup();
		render( <TransferConnectionOwnership { ...props } /> );
		await chooseKazz( user );
		await user.click( screen.getByRole( 'button', { name: 'Continue' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Transfer ownership' } ) );

		await expect(
			screen.findAllByText( 'Could not confirm new owner.' )
		).resolves.not.toHaveLength( 0 );
	} );

	// The confirm step interpolates an element into a translated string; a name spliced
	// into that string rather than passed as a child could break the parse.
	it( 'renders a display name containing markup literally', async () => {
		mockFetchCandidates.mockResolvedValue( [
			{
				id: 7,
				login: 'kazz',
				displayName: '<b>Kazz</b>',
				email: 'kazz@example.com',
				avatar: 'https://example.com/kazz.png',
			},
		] );
		const user = userEvent.setup();
		render( <TransferConnectionOwnership { ...props } /> );

		await chooseKazz( user );
		await user.click( screen.getByRole( 'button', { name: 'Continue' } ) );

		// Both the handover line and the support notice name the new owner.
		await expect( screen.findAllByText( '<b>Kazz</b>' ) ).resolves.toHaveLength( 2 );
		expect( screen.getByText( /will become the connection owner/ ) ).toBeInTheDocument();
	} );

	it( 'says so when the candidates cannot be loaded', async () => {
		mockFetchCandidates.mockRejectedValue( new Error( 'Network down' ) );
		render( <TransferConnectionOwnership { ...props } /> );

		await expect(
			screen.findAllByText( /Could not load the administrators/ )
		).resolves.not.toHaveLength( 0 );
		// Not the empty state: nobody has established that there is no one to choose.
		expect( screen.queryByText( 'No other connected administrators' ) ).not.toBeInTheDocument();
	} );

	it( 'explains the empty case rather than offering an action nobody can take', async () => {
		mockFetchCandidates.mockResolvedValue( [] );
		render( <TransferConnectionOwnership { ...props } /> );

		await expect(
			screen.findByText( 'No other connected administrators' )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'combobox' ) ).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'Transfer ownership' } )
		).not.toBeInTheDocument();
		// The chooser prompt would be pointing at a list that is not there.
		expect( screen.queryByText( /Choose a connected administrator/ ) ).not.toBeInTheDocument();
	} );

	describe( 'tracking', () => {
		const transfer = async ( user: ReturnType< typeof userEvent.setup > ) => {
			await chooseKazz( user );
			await user.click( screen.getByRole( 'button', { name: 'Continue' } ) );
			await user.click( screen.getByRole( 'button', { name: 'Transfer ownership' } ) );
		};

		it( 'reports the attempt and the success for a tracking context', async () => {
			const user = userEvent.setup();
			render( <TransferConnectionOwnership { ...props } trackingContext="connectors" /> );
			await transfer( user );

			await waitFor( () =>
				expect( mockRecordEvent ).toHaveBeenCalledWith(
					'jetpack_connection_owner_transfer_success',
					{ context: 'connectors' }
				)
			);
			expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_connection_owner_transfer_attempt', {
				context: 'connectors',
			} );
		} );

		it.each( [
			[ 'ownership_locked', 'ownership_locked' ],
			[ 'new_owner_not_admin', 'new_owner_not_admin' ],
			[ 'new_owner_not_connected', 'new_owner_not_connected' ],
			[ 'new_owner_is_existing_owner', 'new_owner_is_existing_owner' ],
			[ 'something_new', 'unknown' ],
		] )( 'reports a %s refusal with reason %s', async ( code, reason ) => {
			mockSetConnectionOwner.mockRejectedValue( apiError( code, 'Raw server text' ) );
			const user = userEvent.setup();
			render( <TransferConnectionOwnership { ...props } trackingContext="connectors" /> );
			await transfer( user );

			await waitFor( () =>
				expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_connection_owner_transfer_error', {
					reason,
					context: 'connectors',
				} )
			);
		} );

		it( 'reports a candidate list that could not load', async () => {
			mockFetchCandidates.mockRejectedValue( new Error( 'offline' ) );
			render( <TransferConnectionOwnership { ...props } trackingContext="connectors" /> );

			await waitFor( () =>
				expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_connection_owner_transfer_error', {
					reason: 'candidates_load_failed',
					context: 'connectors',
				} )
			);
		} );

		it( 'reports a null context when none is passed', async () => {
			const user = userEvent.setup();
			render( <TransferConnectionOwnership { ...props } /> );
			await transfer( user );

			await waitFor( () => expect( mockSetConnectionOwner ).toHaveBeenCalled() );
			expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_connection_owner_transfer_attempt', {
				context: null,
			} );
		} );
	} );
} );
