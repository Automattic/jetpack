import { render, screen } from '@testing-library/react';
import OnboardingScreen from '..';

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
