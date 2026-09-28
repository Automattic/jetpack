import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { dispatch, useDispatch, useSelect } from '@wordpress/data';
import { SelectPlatform } from '..';
import { store } from '../../../../social-store';
import { setup } from '../../../../utils/test-factory';

// Services with no input step connect from this click, so the popup is stubbed.
const mockRequestAccess = jest.fn();
let mockRequestAccessOptions;

jest.mock( '../../../services/use-request-access', () => ( {
	useRequestAccess: options => {
		mockRequestAccessOptions = options;

		return mockRequestAccess;
	},
} ) );

// The step is body-only; the connection-flow modal owns the Dialog chrome.
const renderStep = () => render( <SelectPlatform /> );

const getStoreSelect = () => {
	let storeSelect;
	renderHook( () => useSelect( select => ( storeSelect = select( store ) ) ) );
	return storeSelect;
};

const getStoreDispatch = () => renderHook( () => useDispatch( store ) ).result.current;

/* Subscribers re-render on dispatch, so dispatch inside act(), and never return
   the dispatch promise, or act() defers the flush. */
const dispatchToStore = action => {
	act( () => {
		action( dispatch( store ) );
	} );
};

// What the step asked the connect popup for.
const getRequest = () => {
	const [ service, formData, options ] = mockRequestAccess.mock.calls[ 0 ];

	return { service, values: Object.fromEntries( formData ), options };
};

const REQUEST_ID = 'request-1';

const clickFacebook = user => user.click( screen.getByRole( 'button', { name: /Facebook/ } ) );

describe( 'SelectPlatform', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	test( 'renders a card for each supported service', () => {
		setup();
		renderStep();

		// The shared factory seeds Facebook, LinkedIn and Instagram Business.
		expect( screen.getByRole( 'button', { name: /Facebook/ } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: /LinkedIn/ } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: /Instagram/ } ) ).toBeInTheDocument();
		expect( screen.getAllByRole( 'listitem' ) ).toHaveLength( 3 );
		// The account-type descriptor is rendered alongside the platform name.
		expect( screen.getByText( 'Page' ) ).toBeInTheDocument();
	} );

	test( 'selecting a service with custom inputs advances to platform-input', async () => {
		const user = userEvent.setup();
		setup();
		const storeSelect = getStoreSelect();
		jest
			.spyOn( storeSelect, 'getServicesList' )
			.mockReturnValue( [ { id: 'bluesky', label: 'Bluesky', status: 'ok' } ] );

		renderStep();
		await user.click( screen.getByRole( 'button', { name: /Bluesky/ } ) );

		expect( storeSelect.getConnectionFlowSelectedServiceId() ).toBe( 'bluesky' );
		expect( storeSelect.getConnectionFlowStep() ).toBe( 'platform-input' );
		// Its credentials come first; the popup opens from that step's submit.
		expect( mockRequestAccess ).not.toHaveBeenCalled();
	} );

	describe( 'a service that connects straight from the picker', () => {
		beforeEach( () => {
			setup();
			mockRequestAccess.mockResolvedValue( REQUEST_ID );
			dispatchToStore( ( { startConnectionFlow } ) =>
				startConnectionFlow( { origin: 'dashboard' } )
			);
		} );

		test( 'opens the connect popup, then advances to authorizing', async () => {
			const user = userEvent.setup();
			renderStep();

			await clickFacebook( user );

			expect( getRequest().service.id ).toBe( 'facebook' );
			expect( getRequest().values ).toEqual( {} );
			expect( getRequest().options.refresh ).toBe( false );

			const storeSelect = getStoreSelect();
			expect( storeSelect.getConnectionFlowSelectedServiceId() ).toBe( 'facebook' );
			expect( storeSelect.getConnectionFlowStep() ).toBe( 'authorizing' );
		} );

		test( 'stays on the picker and explains a blocked popup', async () => {
			const user = userEvent.setup();
			mockRequestAccess.mockImplementation( ( service, formData, options ) => {
				options.onError( 'The connection window could not be opened.' );

				return Promise.resolve( null );
			} );

			renderStep();
			await clickFacebook( user );

			const storeSelect = getStoreSelect();
			expect( storeSelect.getConnectionFlowStep() ).toBe( 'select-platform' );
			expect(
				screen.getAllByText( 'The connection window could not be opened.' ).length
			).toBeGreaterThan( 0 );
		} );

		test( 'returns to the picker when the attempt is abandoned', async () => {
			const user = userEvent.setup();
			renderStep();
			await clickFacebook( user );

			act( () => {
				getRequest().options.onAbort( REQUEST_ID );
			} );

			const storeSelect = getStoreSelect();
			expect( storeSelect.getConnectionFlowStep() ).toBe( 'select-platform' );
			expect( storeSelect.getConnectionFlowError() ).toMatch( /cancelled/ );
		} );

		/* The abandoned popup keeps listening, and the step that opened it unmounts
		   on the way to `authorizing`, so the flow itself has to disown it. */
		test( 'ignores an abort from an attempt that has been superseded', async () => {
			const user = userEvent.setup();
			renderStep();
			await clickFacebook( user );

			const stale = getRequest().options.onAbort;

			// Back to the picker, then off again on a fresh request.
			act( () => {
				stale( REQUEST_ID );
			} );
			mockRequestAccess.mockResolvedValue( 'request-2' );
			await clickFacebook( user );

			act( () => {
				stale( REQUEST_ID );
			} );

			expect( getStoreSelect().getConnectionFlowStep() ).toBe( 'authorizing' );
		} );

		test( 'ignores a result from an attempt that has been superseded', async () => {
			const user = userEvent.setup();
			const { stubSetKeyringResult } = setup();
			const storeDispatch = getStoreDispatch();
			jest.spyOn( storeDispatch, 'fetchKeyringResult' ).mockResolvedValue( { ID: 42 } );

			renderStep();
			await clickFacebook( user );

			mockRequestAccess.mockResolvedValue( 'request-2' );
			await clickFacebook( user );

			await act( async () => {
				await mockRequestAccessOptions.onConfirm( REQUEST_ID );
			} );

			expect( stubSetKeyringResult ).not.toHaveBeenCalled();
		} );

		test( 'ignores a result that lands after the flow has moved on', async () => {
			const user = userEvent.setup();
			const { stubSetKeyringResult } = setup();
			const storeDispatch = getStoreDispatch();
			// The flow is cancelled while the verified result is being fetched.
			jest.spyOn( storeDispatch, 'fetchKeyringResult' ).mockImplementation( async () => {
				storeDispatch.cancelConnectionFlow();

				return { ID: 42 };
			} );

			renderStep();
			await clickFacebook( user );

			await act( async () => {
				await mockRequestAccessOptions.onConfirm( REQUEST_ID );
			} );

			expect( stubSetKeyringResult ).not.toHaveBeenCalled();
		} );

		test( 'ignores a second card while the first is still opening', async () => {
			const user = userEvent.setup();
			let openPopup;
			mockRequestAccess.mockReturnValue(
				new Promise( resolve => {
					openPopup = resolve;
				} )
			);

			renderStep();
			await clickFacebook( user );
			// Including an input service, which would otherwise change the selection.
			await user.click( screen.getByRole( 'button', { name: /LinkedIn/ } ) );

			expect( mockRequestAccess ).toHaveBeenCalledTimes( 1 );

			await act( async () => {
				openPopup( REQUEST_ID );
			} );

			expect( getStoreSelect().getConnectionFlowSelectedServiceId() ).toBe( 'facebook' );
		} );

		test( 'surfaces the keyring result so the flow can confirm it', async () => {
			const user = userEvent.setup();
			const { stubSetKeyringResult } = setup();
			const storeDispatch = getStoreDispatch();
			jest.spyOn( storeDispatch, 'fetchKeyringResult' ).mockResolvedValue( { ID: 42 } );
			jest.spyOn( storeDispatch, 'completeReconnect' ).mockResolvedValue( false );

			renderStep();
			await clickFacebook( user );

			await act( async () => {
				await mockRequestAccessOptions.onConfirm( REQUEST_ID );
			} );

			expect( stubSetKeyringResult ).toHaveBeenCalledWith( { ID: 42 } );
		} );

		test( 'does not strand the user when the popup returns nothing usable', async () => {
			const user = userEvent.setup();
			const storeDispatch = getStoreDispatch();
			jest.spyOn( storeDispatch, 'fetchKeyringResult' ).mockResolvedValue( undefined );
			jest.spyOn( storeDispatch, 'completeReconnect' ).mockResolvedValue( false );

			renderStep();
			await clickFacebook( user );

			await act( async () => {
				await mockRequestAccessOptions.onConfirm( REQUEST_ID );
			} );

			await waitFor( () =>
				expect( getStoreSelect().getConnectionFlowStep() ).toBe( 'select-platform' )
			);
			expect( getStoreSelect().getConnectionFlowError() ).toMatch( /could not be completed/ );
		} );
	} );
} );
