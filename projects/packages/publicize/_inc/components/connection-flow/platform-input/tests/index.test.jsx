import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { dispatch, useSelect } from '@wordpress/data';
import { PlatformInput } from '..';
import { store } from '../../../../social-store';
import { setup } from '../../../../utils/test-factory';

// Only the submit tests connect, so stubbing the connect call is contained.
const mockRequestAccess = jest.fn();

jest.mock( '../../../services/use-request-access', () => ( {
	useRequestAccess: () => mockRequestAccess,
} ) );

const SERVICES = [
	{ id: 'mastodon', label: 'Mastodon', status: 'ok', url: 'https://connect.test/mastodon' },
	{ id: 'bluesky', label: 'Bluesky', status: 'ok', url: 'https://connect.test/bluesky' },
];

const getStoreSelect = () => {
	let storeSelect;
	renderHook( () => useSelect( select => ( storeSelect = select( store ) ) ) );
	return storeSelect;
};

/* Subscribers re-render on dispatch, so dispatch inside act() — and never
   return the dispatch promise, or act() defers the flush. */
const dispatchToStore = action => {
	act( () => {
		action( dispatch( store ) );
	} );
};

// The step is body-only; the connection-flow modal owns the Dialog chrome.
const renderStep = serviceId => {
	dispatchToStore( ( { selectPlatform } ) => selectPlatform( serviceId ) );

	return render( <PlatformInput /> );
};

const getHandleField = () => screen.getByRole( 'textbox', { name: 'Handle' } );

// A disabled @wordpress/ui Button stays focusable, so it carries `aria-disabled`.
const getSubmitButton = () => screen.getByRole( 'button', { name: 'Submit' } );

describe( 'PlatformInput', () => {
	beforeEach( () => {
		setup();
		mockRequestAccess.mockResolvedValue( 'request-1' );
		jest.spyOn( getStoreSelect(), 'getServicesList' ).mockReturnValue( SERVICES );
		// Starting the flow also clears anything a previous test entered, but the
		// reconnecting account lives outside the flow state, so reset it too.
		dispatchToStore( ( { setConnections, setReconnectingAccount, startConnectionFlow } ) => {
			setConnections( [] );
			setReconnectingAccount( undefined );
			startConnectionFlow( { origin: 'dashboard' } );
		} );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	test( 'renders the Mastodon field with its placeholder and helper text', () => {
		renderStep( 'mastodon' );

		expect(
			screen.getByText(
				'To share to Mastodon please enter your Mastodon username below, then click Submit.'
			)
		).toBeInTheDocument();
		expect( getHandleField() ).toHaveAttribute( 'placeholder', '@username@mastodon.social' );
		expect(
			screen.getByText( 'You can find the handle in your Mastodon profile.' )
		).toBeInTheDocument();
	} );

	test( 'keeps Submit disabled until the Mastodon handle is valid', async () => {
		const user = userEvent.setup();
		renderStep( 'mastodon' );

		expect( getSubmitButton() ).toHaveAttribute( 'aria-disabled', 'true' );

		await user.type( getHandleField(), 'not-a-handle' );
		expect( getSubmitButton() ).toHaveAttribute( 'aria-disabled', 'true' );

		await user.clear( getHandleField() );
		await user.type( getHandleField(), '@user@mastodon.social' );
		expect( getSubmitButton() ).toHaveAttribute( 'aria-disabled', 'false' );
	} );

	test( 'flags an already connected Mastodon account inline', async () => {
		const user = userEvent.setup();
		dispatchToStore( ( { setConnections } ) =>
			setConnections( [
				{ connection_id: '1', service_name: 'mastodon', external_handle: '@user@mastodon.social' },
			] )
		);

		renderStep( 'mastodon' );

		await user.type( getHandleField(), '@user@mastodon.social' );

		// The Notice renders the message and @wordpress/a11y mirrors it into a
		// live region, so the copy appears more than once — assert it's present.
		expect(
			screen.getAllByText( 'This Mastodon account is already connected' ).length
		).toBeGreaterThan( 0 );
		expect( getSubmitButton() ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	test( 'gates Bluesky on both the handle and the app password', async () => {
		const user = userEvent.setup();
		renderStep( 'bluesky' );

		await user.type( getHandleField(), 'user.bsky.social' );
		expect( getSubmitButton() ).toHaveAttribute( 'aria-disabled', 'true' );

		await user.type( screen.getByLabelText( 'App password' ), 'xxxx-xxxx-xxxx-xxxx' );
		expect( getSubmitButton() ).toHaveAttribute( 'aria-disabled', 'false' );
	} );

	test( 'explains a malformed handle once the field is left', async () => {
		const user = userEvent.setup();
		renderStep( 'mastodon' );

		await user.type( getHandleField(), 'not-a-handle' );

		// Still typing — no nagging yet.
		expect( screen.queryByText( 'Invalid Mastodon username' ) ).not.toBeInTheDocument();

		await user.tab();

		expect( screen.getByText( 'Invalid Mastodon username' ) ).toBeInTheDocument();
	} );

	test( 'flags a Bluesky handle that carries dots before the suffix', async () => {
		const user = userEvent.setup();
		renderStep( 'bluesky' );

		await user.type( getHandleField(), 'foo.bar.bsky.social' );

		expect( screen.getByText( /Bluesky usernames cannot contain dots/ ) ).toBeInTheDocument();
	} );

	test( 'prefills the handle from the account being reconnected', () => {
		const account = {
			connection_id: '1',
			service_name: 'mastodon',
			external_handle: '@user@mastodon.social',
		};

		// Reconnect is an entry point: it lands straight on this step with the
		// account set, the handle belongs in Mastodon's `instance` field, and the
		// duplicate check is waived so the existing account can re-auth.
		dispatchToStore( ( { setConnections, setReconnectingAccount } ) => {
			setConnections( [ account ] );
			setReconnectingAccount( account );
		} );

		render( <PlatformInput /> );

		expect( getHandleField() ).toHaveValue( '@user@mastodon.social' );
		// A reconnect is allowed to re-auth the already-connected account.
		expect( getSubmitButton() ).toHaveAttribute( 'aria-disabled', 'false' );
	} );

	test( 'keeps the entered handle when going back to the picker and returning', async () => {
		const user = userEvent.setup();
		const { unmount } = renderStep( 'mastodon' );

		await user.type( getHandleField(), '@user@mastodon.social' );

		unmount();
		dispatchToStore( ( { goToPreviousStep } ) => goToPreviousStep() );

		expect( getStoreSelect().getConnectionFlowStep() ).toBe( 'select-platform' );

		// Coming back to the step: the value entered before is still there.
		renderStep( 'mastodon' );

		expect( getHandleField() ).toHaveValue( '@user@mastodon.social' );
		expect( getSubmitButton() ).toHaveAttribute( 'aria-disabled', 'false' );
	} );

	test( 'submitting opens the popup with the entered values, then advances', async () => {
		const user = userEvent.setup();
		renderStep( 'mastodon' );

		await user.type( getHandleField(), '@user@mastodon.social' );
		await user.click( getSubmitButton() );

		const [ service, formData ] = mockRequestAccess.mock.calls[ 0 ];
		expect( service.id ).toBe( 'mastodon' );
		expect( Object.fromEntries( formData ) ).toEqual( { instance: '@user@mastodon.social' } );
		expect( getStoreSelect().getConnectionFlowStep() ).toBe( 'authorizing' );
	} );

	test( 'stays put and explains a blocked popup', async () => {
		const user = userEvent.setup();
		mockRequestAccess.mockImplementation( ( service, formData, options ) => {
			options.onError( 'The connection window could not be opened.' );

			return Promise.resolve( null );
		} );
		renderStep( 'mastodon' );

		await user.type( getHandleField(), '@user@mastodon.social' );
		await user.click( getSubmitButton() );

		expect( getStoreSelect().getConnectionFlowStep() ).toBe( 'platform-input' );
		// The Notice mirrors the message into a live region, so it appears twice.
		expect(
			screen.getAllByText( 'The connection window could not be opened.' ).length
		).toBeGreaterThan( 0 );
	} );

	test( 'recovers when the connect request rejects', async () => {
		const user = userEvent.setup();
		mockRequestAccess.mockRejectedValueOnce( new Error( 'boom' ) );
		renderStep( 'mastodon' );

		await user.type( getHandleField(), '@user@mastodon.social' );
		await user.click( getSubmitButton() );

		// Without the finally the button would stay loading with no way forward.
		await waitFor( () => expect( getSubmitButton() ).toHaveAttribute( 'aria-disabled', 'false' ) );
		expect( getStoreSelect().getConnectionFlowStep() ).toBe( 'platform-input' );
		expect( screen.getAllByText( /Could not start the connection/ ).length ).toBeGreaterThan( 0 );
	} );

	test( 'sends the reconnect handle even when the field is untouched', async () => {
		const user = userEvent.setup();
		const account = {
			connection_id: '1',
			service_name: 'mastodon',
			external_handle: '@user@mastodon.social',
		};

		dispatchToStore( ( { setConnections, setReconnectingAccount } ) => {
			setConnections( [ account ] );
			setReconnectingAccount( account );
		} );

		render( <PlatformInput /> );
		await user.click( getSubmitButton() );

		const [ , formData, options ] = mockRequestAccess.mock.calls[ 0 ];
		expect( Object.fromEntries( formData ) ).toEqual( { instance: '@user@mastodon.social' } );
		// Keyring re-auths the existing account in place rather than duplicating it.
		expect( options.refresh ).toBe( true );
	} );
} );
