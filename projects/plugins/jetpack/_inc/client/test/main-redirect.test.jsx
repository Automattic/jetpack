import { MemoryRouter, useLocation, useNavigate } from 'react-router';
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

/**
 * Main as its connected wrapper renders it, with the router's location and navigate.
 *
 * @param {object} props - Main props.
 * @return {import('react').ReactElement} Main.
 */
function RoutedMain( props ) {
	return <Main { ...props } location={ useLocation() } navigate={ useNavigate() } />;
}

describe( 'Main', () => {
	it.each( [
		[ 'an admin', true ],
		[ 'a non-admin', false ],
	] )( 'sends %s on the hashless page to Settings', async ( _, canManageModules ) => {
		render(
			<MemoryRouter initialEntries={ [ '/' ] }>
				<RoutedMain
					setInitialState={ jest.fn() }
					clearUnsavedSettingsFlag={ jest.fn() }
					setConnectionStatus={ jest.fn() }
					siteConnectionStatus={ true }
					userCanManageModules={ canManageModules }
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
								currentUser: {
									permissions: { edit_posts: true, manage_modules: canManageModules },
								},
							},
						},
					},
				},
			}
		);

		await expect( screen.findByText( 'Settings sections' ) ).resolves.toBeInTheDocument();
	} );
} );
