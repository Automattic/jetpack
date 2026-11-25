import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useNavigate } from '@wordpress/route';
import { useSettings } from '../../../hooks/use-settings';
import SitePrivacyNotice from '../index';

jest.mock( '@wordpress/route', () => ( {
	__esModule: true,
	useNavigate: jest.fn(),
} ) );

jest.mock( '../../../hooks/use-settings', () => ( {
	...jest.requireActual( '../../../hooks/use-settings' ),
	useSettings: jest.fn(),
} ) );

const mockUseSettings = useSettings as jest.Mock;
const mockNavigate = jest.fn();

const withSettings = ( data?: object ) =>
	mockUseSettings.mockReturnValue( {
		data: data && {
			videoPressVideosPrivateForSite: true,
			siteType: 'jetpack',
			siteIsPrivate: false,
			...data,
		},
	} );

describe( 'SitePrivacyNotice', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		( useNavigate as jest.Mock ).mockReturnValue( mockNavigate );
	} );

	it.each( [
		[ 'loading', undefined ],
		[ 'off', { videoPressVideosPrivateForSite: false } ],
	] )( 'renders nothing while the setting is %s', ( _label, data ) => {
		withSettings( data );
		const { container } = render( <SitePrivacyNotice /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'links to the Settings tab when the setting is on', async () => {
		withSettings( {} );
		render( <SitePrivacyNotice /> );

		expect( screen.getByText( /Only logged-in users can play your videos/ ) ).toBeInTheDocument();
		await userEvent.click( screen.getByRole( 'button', { name: 'Change in Settings' } ) );
		expect( mockNavigate ).toHaveBeenCalledWith( { href: '/settings' } );
	} );

	it( 'points at the site’s privacy instead of the toggle when the server controls it', () => {
		withSettings( { siteType: 'simple' } );
		render( <SitePrivacyNotice /> );

		expect( screen.getByText( /Your site is private/ ) ).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'Change in Settings' } )
		).not.toBeInTheDocument();
	} );
} );
