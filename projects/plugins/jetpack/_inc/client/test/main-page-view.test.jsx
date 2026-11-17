import { MemoryRouter, useLocation, useNavigate } from 'react-router';
import analytics from 'lib/analytics';
import { render, screen } from 'test/test-utils';
import { Main } from '../main';

jest.mock( 'components/admin-notices', () => () => null );
jest.mock( 'components/footer', () => () => null );
jest.mock( 'components/jetpack-notices', () => () => null );
jest.mock( 'components/masthead', () => () => null );
jest.mock(
	'components/settings-admin-page',
	() =>
		( { children } ) =>
			children
);
jest.mock( 'components/settings-nav-tabs', () => () => null );
jest.mock( 'components/tracker', () => () => null );
jest.mock( 'settings/index.jsx', () => () => <p>Settings sections</p> );
jest.mock( 'lib/analytics', () => ( {
	__esModule: true,
	default: { initialize: jest.fn(), tracks: { recordEvent: jest.fn() } },
} ) );

/**
 * Main as its connected wrapper renders it.
 *
 * @param {object} props - Main props.
 * @return {import('react').ReactElement} Main.
 */
function RoutedMain( props ) {
	return <Main { ...props } location={ useLocation() } navigate={ useNavigate() } />;
}

const shown = ( page, firstShow ) =>
	window.dispatchEvent(
		new CustomEvent( 'jetpack-admin-shell:page-shown', { detail: { page, firstShow } } )
	);

describe( 'Main page views', () => {
	it( 'records the page view again when the admin shell shows Settings again, not on its first show', async () => {
		render(
			<MemoryRouter initialEntries={ [ '/settings' ] }>
				<RoutedMain
					setInitialState={ jest.fn() }
					clearUnsavedSettingsFlag={ jest.fn() }
					setConnectionStatus={ jest.fn() }
					siteConnectionStatus={ true }
					isSiteConnected={ true }
					currentVersion="1.0"
					userCanManageModules={ true }
				/>
			</MemoryRouter>,
			{
				initialState: {
					jetpack: {
						connection: {
							status: { siteConnected: { isActive: true, offlineMode: { isActive: false } } },
						},
						initialState: {
							userData: {
								currentUser: { permissions: { edit_posts: true, manage_modules: true } },
							},
						},
					},
				},
			}
		);
		await expect( screen.findByText( 'Settings sections' ) ).resolves.toBeInTheDocument();

		shown( 'jetpack-settings', true );
		shown( 'my-jetpack', false );
		shown( 'jetpack-settings', false );

		const view = [ 'jetpack_wpa_page_view', { path: '/settings', current_version: '1.0' } ];
		expect( analytics.tracks.recordEvent.mock.calls ).toEqual( [ view, view ] );
	} );
} );
