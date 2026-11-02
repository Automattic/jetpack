import { MemoryRouter } from 'react-router';
import { render, screen } from 'test/test-utils';
import Settings from '../index';

jest.mock( 'discussion', () => () => null );
jest.mock( 'earn', () => () => null );
jest.mock( 'newsletter', () => () => null );
jest.mock( 'performance', () => () => null );
jest.mock( 'privacy', () => () => null );
jest.mock( 'reader', () => () => null );
jest.mock( 'searchable-modules', () => () => null );
jest.mock( 'security', () => () => null );
jest.mock( 'sharing', () => () => null );
jest.mock( 'traffic', () => () => null );
jest.mock( 'writing', () => () => null );

const buildState = ( module, canManageModules ) => ( {
	jetpack: {
		initialState: {
			userData: { currentUser: { permissions: { manage_modules: canManageModules } } },
		},
		modules: { items: { [ module ]: { module, name: module, activated: true } } },
		search: { searchTerm: module },
	},
} );

describe( 'Settings search', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it.each( [
		[ 'earn', false, true, false ],
		[ 'earn', true, true, true ],
		[ 'publicize', true, true, true ],
		[ 'publicize', true, false, false ],
		[ 'videopress', true, true, true ],
	] )(
		'searching %s with the flag on: %s, as an admin: %s, shows no matching settings: %s',
		( module, flag, canManageModules, isEmpty ) => {
			window.JetpackScriptData = { myJetpack: { settingsConsolidation: flag } };

			render(
				<MemoryRouter>
					<Settings searchTerm={ module } userCanManageModules={ canManageModules } />
				</MemoryRouter>,
				{ initialState: buildState( module, canManageModules ) }
			);

			expect( Boolean( screen.queryByText( 'No matching settings' ) ) ).toBe( isEmpty );
		}
	);
} );
