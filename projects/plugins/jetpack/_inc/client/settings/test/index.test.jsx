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

const buildState = ( module, { activated = true, isBlockTheme = false } = {} ) => ( {
	jetpack: {
		initialState: {
			themeData: { isBlockTheme },
			userData: { currentUser: { permissions: { manage_modules: true } } },
		},
		modules: { items: { [ module ]: { module, name: module, activated } } },
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
		// Features hides inactive widget modules on a block theme, so no pointer is left.
		[ 'widgets', true, true, { activated: false, isBlockTheme: true } ],
	] )(
		'searching %s with the settings flag %s shows no matching settings: %s',
		( module, flag, isEmpty, site = {} ) => {
			window.JetpackScriptData = { myJetpack: { settingsConsolidation: flag } };

			render(
				<MemoryRouter>
					<Settings searchTerm={ module } userCanManageModules />
				</MemoryRouter>,
				{ initialState: buildState( module, site ) }
			);

			expect( Boolean( screen.queryByText( 'No matching settings' ) ) ).toBe( isEmpty );
		}
	);
} );

describe( 'Settings search for Google Analytics', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	// Google Analytics is not a module, so only the Traffic pointer or card matches it.
	it.each( [
		[ 'finds', 'on WoA', 'woa', false ],
		[ 'finds nothing', 'elsewhere', '', true ],
	] )( '%s %s', ( _verb, _where, host, isEmpty ) => {
		window.JetpackScriptData = { site: { host } };
		const state = buildState( 'stats' );
		state.jetpack.search.searchTerm = 'google analytics';

		render(
			<MemoryRouter>
				<Settings searchTerm="google analytics" userCanManageModules />
			</MemoryRouter>,
			{ initialState: state }
		);

		expect( Boolean( screen.queryByText( 'No matching settings' ) ) ).toBe( isEmpty );
	} );
} );
