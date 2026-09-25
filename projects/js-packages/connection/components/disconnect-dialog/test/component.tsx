import { jest } from '@jest/globals';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ESM test: static jest.mock does not work under --experimental-vm-modules, so mock the modules
// with unstable_mockModule (must run before the dynamic import of the component below).
const mockDisconnectSite = jest.fn< () => Promise< unknown > >();
const mockSubmitSurvey = jest.fn< ( data: unknown ) => Promise< unknown > >();
const mockSetApiRoot = jest.fn();
const mockSetApiNonce = jest.fn();
const mockRecordEvent = jest.fn();

jest.unstable_mockModule( '@automattic/jetpack-api', () => ( {
	__esModule: true,
	default: {
		setApiRoot: mockSetApiRoot,
		setApiNonce: mockSetApiNonce,
		disconnectSite: mockDisconnectSite,
		submitSurvey: mockSubmitSurvey,
	},
} ) );

jest.unstable_mockModule( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: mockRecordEvent }, initialize: jest.fn() },
} ) );

const { default: DisconnectDialog } = await import( '../index' );

describe( 'DisconnectDialog', () => {
	const testProps = {
		apiNonce: 'test',
		apiRoot: 'https://example.org/wp-json/',
		isOpen: true, // render open for tests, nothing renders if this is false
		onClose: jest.fn(),
	};

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'Initially', () => {
		it( 'renders the Modal', () => {
			render( <DisconnectDialog { ...testProps } /> );
			expect(
				screen.getByRole( 'dialog', { name: 'Are you sure you want to disconnect?' } )
			).toBeInTheDocument();
		} );

		it( 'renders the "StepDisconnect" step', () => {
			render( <DisconnectDialog { ...testProps } /> );
			expect(
				within(
					screen.getByRole( 'dialog', { name: 'Are you sure you want to disconnect?' } )
				).getByRole( 'heading' )
			).toHaveTextContent( 'Are you sure you want to disconnect?' );
		} );
	} );

	describe( 'when disconnecting fails', () => {
		it( 'shows the Error instance message', async () => {
			mockDisconnectSite.mockRejectedValueOnce( new Error( 'network is down' ) );
			const user = userEvent.setup();
			render( <DisconnectDialog { ...testProps } /> );

			await user.click( screen.getByRole( 'button', { name: 'Disconnect' } ) );

			await expect( screen.findByText( 'network is down' ) ).resolves.toBeInTheDocument();
		} );

		it( 'shows a plain string rejection as-is', async () => {
			mockDisconnectSite.mockRejectedValueOnce( 'just a string rejection' );
			const user = userEvent.setup();
			render( <DisconnectDialog { ...testProps } /> );

			await user.click( screen.getByRole( 'button', { name: 'Disconnect' } ) );

			await expect( screen.findByText( 'just a string rejection' ) ).resolves.toBeInTheDocument();
		} );

		it( 'shows a default message instead of rendering a non-Error, non-string rejection raw', async () => {
			mockDisconnectSite.mockRejectedValueOnce( { code: 'weird_shape' } );
			const user = userEvent.setup();
			render( <DisconnectDialog { ...testProps } /> );

			await user.click( screen.getByRole( 'button', { name: 'Disconnect' } ) );

			await expect(
				screen.findByText( 'There was a problem disconnecting your account. Please try again.' )
			).resolves.toBeInTheDocument();
		} );

		it( 'calls onError with the raw rejection value', async () => {
			const rejection = new Error( 'boom' );
			mockDisconnectSite.mockRejectedValueOnce( rejection );
			const onError = jest.fn();
			const user = userEvent.setup();
			render( <DisconnectDialog { ...testProps } onError={ onError } /> );

			await user.click( screen.getByRole( 'button', { name: 'Disconnect' } ) );

			await expect( screen.findByText( 'boom' ) ).resolves.toBeInTheDocument();
			expect( onError ).toHaveBeenCalledWith( rejection );
		} );
	} );

	describe( 'when disconnecting succeeds', () => {
		it( 'advances to the confirm step', async () => {
			mockDisconnectSite.mockResolvedValueOnce( undefined );
			const user = userEvent.setup();
			render( <DisconnectDialog { ...testProps } /> );

			await user.click( screen.getByRole( 'button', { name: 'Disconnect' } ) );

			await expect(
				screen.findByText( /Jetpack has been successfully disconnected/i )
			).resolves.toBeInTheDocument();
		} );
	} );

	describe( 'on the plugins page', () => {
		const deactivate = jest.fn();
		const pluginsProps = {
			...testProps,
			context: 'plugins',
			connectedSiteId: 123,
			pluginScreenDisconnectCallback: deactivate,
		};
		const mockFetch = jest.fn< typeof fetch >();

		beforeEach( () => {
			global.fetch = mockFetch;
			mockFetch.mockResolvedValue( { json: async () => ( { success: true } ) } as Response );
			mockSubmitSurvey.mockResolvedValue( { success: true } );
		} );

		it( 'sends the answer through the authenticated proxy when the current user is connected', async () => {
			const user = userEvent.setup();
			render( <DisconnectDialog { ...pluginsProps } connectedUser={ { ID: 7, login: 'me' } } /> );

			await user.click( screen.getByRole( 'button', { name: 'Deactivate' } ) );
			expect( deactivate ).not.toHaveBeenCalled();
			expect( screen.queryByText( "I couldn't get it to connect." ) ).not.toBeInTheDocument();

			await user.click( screen.getByRole( 'radio', { name: "It's buggy." } ) );
			await user.click( screen.getByRole( 'button', { name: 'Submit and deactivate' } ) );

			await waitFor( () => expect( deactivate ).toHaveBeenCalled() );
			expect( mockSubmitSurvey ).toHaveBeenCalledWith( {
				site_id: 123,
				survey_id: 'jetpack-plugin-disconnect',
				survey_responses: { 'why-cancel': { response: 'buggy', text: null } },
			} );
			expect( mockFetch ).not.toHaveBeenCalled();
		} );

		it( 'sends the answer without a user when no user ever connected', async () => {
			const user = userEvent.setup();
			render( <DisconnectDialog { ...pluginsProps } hasConnectedUser={ false } /> );

			await user.click( screen.getByRole( 'button', { name: 'Deactivate' } ) );
			await user.click( screen.getByRole( 'radio', { name: "I couldn't get it to connect." } ) );
			await user.click( screen.getByRole( 'button', { name: 'Submit and deactivate' } ) );

			await waitFor( () => expect( deactivate ).toHaveBeenCalled() );
			expect( mockFetch ).toHaveBeenCalledWith(
				'https://public-api.wordpress.com/wpcom/v2/marketing/feedback-survey',
				expect.objectContaining( { method: 'POST' } )
			);
			expect( JSON.parse( mockFetch.mock.calls[ 0 ][ 1 ].body as string ) ).toEqual( {
				site_id: 123,
				survey_id: 'jetpack-plugin-disconnect',
				survey_responses: { 'why-cancel': { response: 'could-not-connect', text: null } },
			} );
			expect( mockSubmitSurvey ).not.toHaveBeenCalled();
		} );

		it( 'still deactivates when the submission fails', async () => {
			mockFetch.mockRejectedValueOnce( new Error( 'offline' ) );
			const user = userEvent.setup();
			render( <DisconnectDialog { ...pluginsProps } hasConnectedUser={ false } /> );

			await user.click( screen.getByRole( 'button', { name: 'Deactivate' } ) );
			await user.click( screen.getByRole( 'radio', { name: "It's buggy." } ) );
			await user.click( screen.getByRole( 'button', { name: 'Submit and deactivate' } ) );

			await waitFor( () => expect( deactivate ).toHaveBeenCalled() );
		} );

		it( 'deactivates without sending anything when the survey is skipped', async () => {
			const user = userEvent.setup();
			render( <DisconnectDialog { ...pluginsProps } hasConnectedUser={ false } /> );

			await user.click( screen.getByRole( 'button', { name: 'Deactivate' } ) );
			await user.click( screen.getByRole( 'link', { name: 'Skip and deactivate' } ) );

			expect( deactivate ).toHaveBeenCalledTimes( 1 );
			expect( mockFetch ).not.toHaveBeenCalled();
			expect( mockSubmitSurvey ).not.toHaveBeenCalled();
		} );

		it( 'deactivates right away when another user is connected but the current user is not', async () => {
			const user = userEvent.setup();
			render( <DisconnectDialog { ...pluginsProps } /> );

			await user.click( screen.getByRole( 'button', { name: 'Deactivate' } ) );

			expect( deactivate ).toHaveBeenCalledTimes( 1 );
			expect(
				screen.queryByRole( 'button', { name: 'Submit and deactivate' } )
			).not.toBeInTheDocument();
		} );

		it( 'deactivates right away when there is no site ID', async () => {
			const user = userEvent.setup();
			render(
				<DisconnectDialog
					{ ...pluginsProps }
					connectedSiteId={ undefined }
					hasConnectedUser={ false }
				/>
			);

			await user.click( screen.getByRole( 'button', { name: 'Deactivate' } ) );

			expect( deactivate ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
