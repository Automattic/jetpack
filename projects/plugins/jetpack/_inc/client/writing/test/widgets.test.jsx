import { render, screen } from 'test/test-utils';
import Widgets from '../widgets';

const mockNo = () => false;

jest.mock( 'components/module-settings/with-module-settings-form-helpers', () => ( {
	withModuleSettingsFormHelpers: Component => props => (
		<Component getOptionValue={ mockNo } isSavingAnyOption={ mockNo } { ...props } />
	),
} ) );
jest.mock( 'components/module-toggle', () => ( {
	ModuleToggle: ( { slug } ) => <div>{ `${ slug } toggle` }</div>,
} ) );
jest.mock( 'components/pointer-card', () => ( {
	FeaturesPointer: ( { search, linksToSettings } ) => (
		<div>{ `Features pointer: ${ search }${ linksToSettings ? '' : ', switch only' }` }</div>
	),
} ) );
jest.mock( 'components/settings-card', () => ( {
	__esModule: true,
	default: ( { children } ) => children,
} ) );
jest.mock( 'components/settings-group', () => ( {
	__esModule: true,
	default: ( { children } ) => children,
} ) );

const NAMES = { widgets: 'Extra Sidebar Widgets', 'widget-visibility': 'Widget Visibility' };
const MODULES = Object.keys( NAMES );

const CLASSIC_OFF = { isBlockTheme: false, activated: false };
const CLASSIC_ON = { isBlockTheme: false, activated: true };
const BLOCK_THEME_OFF = { isBlockTheme: true, activated: false };
const BLOCK_THEME_ON = { isBlockTheme: true, activated: true };

const buildState = ( searchTerm, { isBlockTheme, activated } ) => ( {
	jetpack: {
		initialState: {
			themeData: { isBlockTheme },
			userData: { currentUser: { permissions: { manage_modules: true } } },
		},
		modules: {
			items: Object.fromEntries(
				MODULES.map( module => [ module, { module, name: NAMES[ module ], activated } ] )
			),
		},
		search: { searchTerm },
	},
} );

const shownToggles = () => MODULES.filter( module => screen.queryByText( `${ module } toggle` ) );
const shownPointers = () =>
	screen.queryAllByText( /^Features pointer: / ).map( pointer => pointer.textContent );

describe( 'Widgets', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it.each( [
		[ 'the toggles while the settings flag is off', false, CLASSIC_OFF, '', MODULES, [] ],
		[ 'nothing on the tab once Features switches them', true, CLASSIC_OFF, '', [], [] ],
		[
			'switch-only pointers for a search while they are off',
			true,
			CLASSIC_OFF,
			'widget',
			[],
			[
				'Features pointer: Extra Sidebar Widgets, switch only',
				'Features pointer: Widget Visibility, switch only',
			],
		],
		[
			'a settings pointer for Extra Sidebar Widgets while it is on',
			true,
			CLASSIC_ON,
			'widget',
			[],
			[
				'Features pointer: Extra Sidebar Widgets',
				'Features pointer: Widget Visibility, switch only',
			],
		],
		[ 'no pointer on a block theme while they are off', true, BLOCK_THEME_OFF, 'widget', [], [] ],
		[
			'switch-only pointers on a block theme while they are on',
			true,
			BLOCK_THEME_ON,
			'widget',
			[],
			[
				'Features pointer: Extra Sidebar Widgets, switch only',
				'Features pointer: Widget Visibility, switch only',
			],
		],
	] )( 'shows %s', ( _label, flag, site, searchTerm, toggles, pointers ) => {
		window.JetpackScriptData = { myJetpack: { settingsConsolidation: flag } };

		render( <Widgets />, { initialState: buildState( searchTerm, site ) } );

		expect( shownToggles() ).toEqual( toggles );
		expect( shownPointers() ).toEqual( pointers );
	} );
} );
