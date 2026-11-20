import { MemoryRouter, useLocation, useNavigate, useNavigationType } from 'react-router';
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
 * Main as its connected wrapper renders it, next to how the router last navigated.
 *
 * @param {object} props - Main props.
 * @return {import('react').ReactElement} Main.
 */
function RoutedMain( props ) {
	return (
		<>
			<Main { ...props } location={ useLocation() } navigate={ useNavigate() } />
			<p data-testid="navigation-type">{ useNavigationType() }</p>
		</>
	);
}

describe( 'Main', () => {
	it.each( [
		[ 'an admin', true ],
		[ 'a non-admin', false ],
	] )( 'replaces the hashless page with Settings for %s', async ( _, canManageModules ) => {
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
		expect( screen.getByTestId( 'navigation-type' ) ).toHaveTextContent( 'REPLACE' );
	} );
} );
