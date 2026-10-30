import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OnboardingScreen from '..';

// The chunk failing to load, as the lazy import sees it.
jest.mock( '../wizard', () => {
	throw new Error( 'Loading chunk 920 failed.' );
} );

const mockConnection = { isRegistered: true, isUserConnected: false };

jest.mock( '@automattic/jetpack-connection', () => ( {
	__esModule: true,
	useConnection: () => ( {
		...mockConnection,
		handleRegisterSite: jest.fn(),
		siteIsRegistering: false,
		userIsConnecting: false,
		registrationError: false,
	} ),
} ) );

jest.mock( '../../../hooks/use-analytics', () => ( {
	__esModule: true,
	default: () => ( { recordEvent: jest.fn() } ),
} ) );

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

const mockAssignLocation = jest.fn();

jest.mock( '../../../hooks/use-notification-watcher/assignLocation', () => ( {
	__esModule: true,
	assignLocation: ( url: string ) => mockAssignLocation( url ),
} ) );

const exitUrl = 'http://example.com/wp-admin/admin.php?page=my-jetpack';
const dashboardUrl = 'http://example.com/wp-admin/';

describe( 'OnboardingScreen when the wizard fails to load', () => {
	beforeEach( () => {
		window.myJetpackInitialState.onboardingWizard = { exitUrl, dashboardUrl };
		Object.assign( mockConnection, { isRegistered: true, isUserConnected: false } );
		mockApiFetch.mockReset().mockResolvedValue( {} );
		mockAssignLocation.mockReset();
	} );

	afterEach( () => {
		delete window.myJetpackInitialState.onboardingWizard;
	} );

	// First, because React.lazy keeps the failed import for the rest of the file.
	it( 'shows the connect screen and logs why', async () => {
		render( <OnboardingScreen /> );

		await expect( screen.findByText( 'Start with Jetpack for free' ) ).resolves.toBeInTheDocument();
		expect( console ).toHaveErrored();
	} );

	it( 'offers no skip before the site accepts the terms', async () => {
		mockConnection.isRegistered = false;
		render( <OnboardingScreen /> );

		await expect( screen.findByText( 'Start with Jetpack for free' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Skip setup' } ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[ 'settled, to My Jetpack', () => mockApiFetch.mockResolvedValue( {} ), exitUrl ],
		[
			'not settled, to wp-admin',
			() => mockApiFetch.mockRejectedValue( new Error() ),
			dashboardUrl,
		],
	] )( 'records a skip and leaves for a site-only connection: %s', async ( _, settle, landing ) => {
		settle();
		render( <OnboardingScreen /> );

		await userEvent.click( await screen.findByRole( 'button', { name: 'Skip setup' } ) );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/my-jetpack/v1/site/onboarding/settled',
			method: 'POST',
			data: { outcome: 'skipped' },
		} );
		await waitFor( () => expect( mockAssignLocation ).toHaveBeenCalledWith( landing ) );
	} );
} );
