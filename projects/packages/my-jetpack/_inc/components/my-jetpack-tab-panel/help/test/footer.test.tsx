import '@testing-library/jest-dom';
import {
	currentUserCan,
	getAdminUrl,
	getScriptData,
	isSimpleSite,
} from '@automattic/jetpack-script-data';
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
const mockGetScriptData = getScriptData as jest.MockedFunction< typeof getScriptData >;
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

	it( 'links All Jetpack modules to the modules page when the Features tab is off', () => {
		render( <HelpFooter /> );

		expect( screen.getByRole( 'link', { name: 'All Jetpack modules' } ) ).toHaveAttribute(
			'href',
			'https://example.com/wp-admin/admin.php?page=jetpack_modules'
		);
	} );

	it( 'links All Jetpack modules to the Features list view when the Features tab is on', () => {
		mockGetScriptData.mockReturnValue( {
			myJetpack: { productsSection: { slug: 'features', label: 'Features' } },
		} as unknown as ReturnType< typeof getScriptData > );

		render( <HelpFooter /> );

		expect( screen.getByRole( 'link', { name: 'All Jetpack modules' } ) ).toHaveAttribute(
			'href',
			'https://example.com/wp-admin/admin.php?page=my-jetpack#/features?view=list'
		);
	} );

	it( 'hides the Useful links section on WordPress.com Simple sites', () => {
		mockIsSimpleSite.mockReturnValue( true );

		render( <HelpFooter /> );

		expect( screen.queryByRole( 'navigation', { name: 'Useful links' } ) ).not.toBeInTheDocument();
		// The rest of the footer still renders.
		expect( screen.getByText( 'Real humans. Real support.' ) ).toBeInTheDocument();
	} );
} );
