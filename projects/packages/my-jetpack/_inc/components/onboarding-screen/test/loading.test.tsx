import { render, screen } from '@testing-library/react';
import OnboardingScreen from '..';
import { withLoadLimit } from '../load-limit';

jest.mock( '../wizard', () => ( { __esModule: true, Wizard: () => 'The wizard' } ) );

describe( 'OnboardingScreen while the wizard loads', () => {
	afterEach( () => {
		delete window.myJetpackInitialState.onboardingWizard;
	} );

	it( 'says it is busy rather than showing an empty window', async () => {
		window.myJetpackInitialState.onboardingWizard = {
			exitUrl: 'http://example.com/wp-admin/admin.php?page=my-jetpack',
			dashboardUrl: 'http://example.com/wp-admin/',
			runScope: 'a1b2c3d4e5f6',
		};
		render( <OnboardingScreen /> );

		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'Loading setup…' );
		await expect( screen.findByText( 'The wizard' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'status' ) ).not.toBeInTheDocument();
	} );
} );

describe( 'withLoadLimit', () => {
	beforeEach( () => jest.useFakeTimers() );
	afterEach( () => jest.useRealTimers() );

	// Webpack waits 120s on a hung chunk; the screen should not.
	it( 'gives up on a load that never arrives', async () => {
		const loading = withLoadLimit( new Promise( () => {} ), 15000 );

		jest.advanceTimersByTime( 15000 );

		await expect( loading ).rejects.toThrow( 'Not loaded after 15s.' );
	} );

	it( 'passes a load that arrives in time straight through, and stops its clock', async () => {
		await expect( withLoadLimit( Promise.resolve( 'chunk' ), 15000 ) ).resolves.toBe( 'chunk' );
		expect( jest.getTimerCount() ).toBe( 0 );
	} );
} );
