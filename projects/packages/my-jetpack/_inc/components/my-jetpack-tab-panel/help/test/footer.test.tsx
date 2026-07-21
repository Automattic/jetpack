import '@testing-library/jest-dom';
import { currentUserCan, getAdminUrl, isSimpleSite } from '@automattic/jetpack-script-data';
import { render, screen } from '@testing-library/react';
import { isJetpackPluginActive } from '../../../../utils/is-jetpack-plugin-active';
import { HelpFooter } from '../footer';

jest.mock( '@automattic/jetpack-script-data' );
jest.mock( '../../../../utils/is-jetpack-plugin-active' );
jest.mock( '../use-help-tracking', () => ( {
	useHelpTracking: () => ( { trackHelpRequest: jest.fn() } ),
} ) );

const mockCurrentUserCan = currentUserCan as jest.MockedFunction< typeof currentUserCan >;
const mockGetAdminUrl = getAdminUrl as jest.MockedFunction< typeof getAdminUrl >;
const mockIsSimpleSite = isSimpleSite as jest.MockedFunction< typeof isSimpleSite >;
const mockIsJetpackPluginActive = isJetpackPluginActive as jest.MockedFunction<
	typeof isJetpackPluginActive
>;

describe( 'HelpFooter', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockCurrentUserCan.mockReturnValue( true );
		mockGetAdminUrl.mockImplementation( path => `https://example.com/wp-admin/${ path }` );
		mockIsJetpackPluginActive.mockReturnValue( true );
		mockIsSimpleSite.mockReturnValue( false );
	} );

	it( 'shows the Useful links section for an admin with the Jetpack plugin active', () => {
		render( <HelpFooter /> );

		expect( screen.getByRole( 'navigation', { name: 'Useful links' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'All Jetpack modules' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Debug information' } ) ).toBeInTheDocument();
	} );

	it( 'hides the Useful links section on WordPress.com Simple sites', () => {
		mockIsSimpleSite.mockReturnValue( true );

		render( <HelpFooter /> );

		expect( screen.queryByRole( 'navigation', { name: 'Useful links' } ) ).not.toBeInTheDocument();
		// The rest of the footer still renders.
		expect( screen.getByText( 'Real humans. Real support.' ) ).toBeInTheDocument();
	} );
} );
