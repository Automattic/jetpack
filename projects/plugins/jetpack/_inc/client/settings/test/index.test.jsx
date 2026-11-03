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

const buildState = module => ( {
	jetpack: {
		initialState: {
			userData: { currentUser: { permissions: { manage_modules: true } } },
		},
		modules: { items: { [ module ]: { module, name: module, activated: true } } },
		search: { searchTerm: module },
	},
} );

describe( 'Settings search', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	// VideoPress and Social keep a pointer to Features, so a search for them still finds something.
	it.each( [
		[ 'earn', false, false ],
		[ 'earn', true, true ],
		[ 'videopress', true, false ],
		[ 'publicize', true, false ],
	] )(
		'searching %s with the settings flag %s shows no matching settings: %s',
		( module, flag, isEmpty ) => {
			window.JetpackScriptData = { myJetpack: { settingsConsolidation: flag } };

			render(
				<MemoryRouter>
					<Settings searchTerm={ module } userCanManageModules />
				</MemoryRouter>,
				{ initialState: buildState( module ) }
			);

			expect( Boolean( screen.queryByText( 'No matching settings' ) ) ).toBe( isEmpty );
		}
	);
} );
