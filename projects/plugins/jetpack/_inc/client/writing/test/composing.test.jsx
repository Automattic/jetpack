import { render, screen } from 'test/test-utils';
import Composing from '../composing';

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
	FeaturesPointer: ( { search } ) => <div>{ `Features pointer: ${ search }` }</div>,
} ) );
jest.mock( '../markdown-moved', () => ( {
	MarkdownMoved: () => <div>markdown panel pointer</div>,
} ) );
jest.mock( 'components/settings-card', () => ( {
	__esModule: true,
	default: ( { children } ) => children,
} ) );
jest.mock( 'components/settings-group', () => ( {
	__esModule: true,
	default: ( { children } ) => children,
} ) );

const NAMES = {
	'copy-post': 'Copy Post',
	markdown: 'Markdown',
	latex: 'Beautiful Math',
	shortcodes: 'Shortcode Embeds',
	blocks: 'Blocks',
};
const MODULES = Object.keys( NAMES );

const buildState = ( canManageModules, searchTerm ) => ( {
	jetpack: {
		initialState: {
			siteData: { showMyJetpack: false },
			userData: { currentUser: { permissions: { manage_modules: canManageModules } } },
		},
		modules: {
			items: Object.fromEntries(
				MODULES.map( module => [ module, { module, name: NAMES[ module ] } ] )
			),
		},
		search: { searchTerm },
	},
} );

const shownToggles = () => MODULES.filter( module => screen.queryByText( `${ module } toggle` ) );
const shownPointers = () =>
	MODULES.filter(
		module =>
			screen.queryByText( `Features pointer: ${ NAMES[ module ] }` ) ||
			screen.queryByText( `${ module } panel pointer` )
	);

describe( 'Composing', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it.each( [
		[ 'every toggle while the settings flag is off', false, true, '', MODULES, [] ],
		[ 'no toggle once the settings move out', true, true, '', [], [] ],
		[
			'a pointer to Features for a search once the flag is on',
			true,
			true,
			'latex',
			[],
			[ 'latex' ],
		],
		[
			'a pointer to the panel for a Markdown search once the flag is on',
			true,
			true,
			'markdown',
			[],
			[ 'markdown' ],
		],
		[ 'every toggle to users who cannot manage modules', true, false, '', MODULES, [] ],
	] )( 'shows %s', ( _label, flag, canManageModules, searchTerm, toggles, pointers ) => {
		window.JetpackScriptData = {
			myJetpack: { settingsConsolidation: flag },
			user: { current_user: { capabilities: {} } },
		};

		render( <Composing />, { initialState: buildState( canManageModules, searchTerm ) } );

		expect( shownToggles() ).toEqual( toggles );
		expect( shownPointers() ).toEqual( pointers );
	} );
} );
