import { MemoryRouter, useLocation, useNavigate } from 'react-router';
import analytics from 'lib/analytics';
import { act, render, screen } from 'test/test-utils';
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

const shellEvent = ( type, detail ) =>
	window.dispatchEvent( new CustomEvent( `jetpack-admin-shell:${ type }`, { detail } ) );
const shown = ( page, firstShow ) => shellEvent( 'page-shown', { page, firstShow } );

let navigateTo;
/**
 * Exposes the router's navigate to the test.
 *
 * @return {null} Nothing.
 */
function Navigator() {
	navigateTo = useNavigate();
	return null;
}

const renderSettings = async () => {
	render(
		<MemoryRouter initialEntries={ [ '/settings' ] }>
			<Navigator />
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
};

beforeEach( () => analytics.tracks.recordEvent.mockClear() );

describe( 'Main page views', () => {
	it( 'records the page view again when the admin shell shows Settings again, not on its first show', async () => {
		await renderSettings();

		shown( 'jetpack-settings', true );
		shown( 'my-jetpack', false );
		shown( 'jetpack-settings', false );

		const view = [ 'jetpack_wpa_page_view', { path: '/settings', current_version: '1.0' } ];
		expect( analytics.tracks.recordEvent.mock.calls ).toEqual( [ view, view ] );
	} );

	it.each( [
		[ 'another path', '/security', '/security' ],
		[ 'the same path with another search term', '/settings?term=ads', '/settings' ],
	] )(
		'records one page view when the admin shell reopens Settings at %s',
		async ( _, route, path ) => {
			await renderSettings();
			analytics.tracks.recordEvent.mockClear();

			shellEvent( 'page-hidden', { page: 'jetpack-settings', next: 'my-jetpack' } );
			act( () => navigateTo( route ) );
			shellEvent( 'page-shown', {
				page: 'jetpack-settings',
				firstShow: false,
				routeChanged: true,
				url: `https://example.com/wp-admin/admin.php?page=jetpack-settings#${ route }`,
			} );

			expect( analytics.tracks.recordEvent.mock.calls ).toEqual( [
				[ 'jetpack_wpa_page_view', { path, current_version: '1.0' } ],
			] );
		}
	);
} );
