import { render, screen } from 'test/test-utils';
import Writing, { Writing as UnconnectedWriting } from '../index';

jest.mock( 'components/data/query-site', () => () => null );
jest.mock( 'state/feature-check', () => ( {
	getActiveFeatureDetails: () => () => new Promise( () => {} ),
} ) );
jest.mock( '../composing', () => () => null );
jest.mock( '../custom-content-types', () => () => null );
jest.mock( '../post-by-email', () => () => null );
jest.mock( '../theme-enhancements', () => () => null );
jest.mock( '../widgets', () => () => null );
jest.mock( '../writing-media', () => () => 'Carousel card' );
jest.mock( '../carousel-moved', () => ( { CarouselMoved: () => 'Carousel pointer' } ) );

const LATEX = { latex: { module: 'latex', name: 'Beautiful Math' } };
const WIDGETS = { widgets: { module: 'widgets', name: 'Extra Sidebar Widgets', activated: false } };

const buildState = ( searchTerm, modules, isBlockTheme ) => ( {
	jetpack: {
		connection: {
			connectUrl: '',
			status: { siteConnected: { isActive: true, offlineMode: { isActive: false } } },
			user: { currentUser: { isConnected: true } },
		},
		initialState: {
			themeData: { isBlockTheme },
			userData: { currentUser: { permissions: { manage_modules: true } } },
		},
		modules: { items: modules },
		search: { searchTerm },
		settings: { items: {} },
	},
} );

// Module scope keeps the prop references stable (react/jsx-no-bind).
const findsOnlyCarousel = module => module === 'carousel';
// Never settles, so the custom content types lookup changes no state after the test.
const noFeatureDetails = () => new Promise( () => undefined );

describe( 'Writing settings', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it.each( [
		[ 'renders', 'on the tab while the settings flag is off', false, '', true ],
		[ 'renders nothing', 'on the tab once the flag is on', true, '', false ],
		[ 'renders', 'for a search once the flag is on', true, 'latex', true ],
		[
			'renders nothing',
			'for a search on a block theme where Features hides it',
			true,
			'widget',
			false,
			WIDGETS,
			true,
		],
	] )(
		'%s for a site whose only Writing module Features switches, %s',
		( _verb, _when, flag, searchTerm, shown, modules = LATEX, isBlockTheme = false ) => {
			window.JetpackScriptData = { myJetpack: { settingsConsolidation: flag } };

			const { container } = render( <Writing active searchTerm={ searchTerm } />, {
				initialState: buildState( searchTerm, modules, isBlockTheme ),
			} );

			expect( container.childElementCount > 0 ).toBe( shown );
		}
	);

	it.each( [
		[ 'off, in the tab', false, '', [ 'Carousel card' ] ],
		[ 'off, in a search', false, 'carousel', [ 'Carousel card' ] ],
		[ 'on, in the tab', true, '', [] ],
		[ 'on, in a search', true, 'carousel', [ 'Carousel pointer' ] ],
	] )( 'with the settings flag %s', ( _name, flag, searchTerm, expected ) => {
		window.JetpackScriptData = { myJetpack: { settingsConsolidation: flag } };
		render(
			<UnconnectedWriting
				active
				userCanManageModules
				searchTerm={ searchTerm }
				isModuleFound={ findsOnlyCarousel }
				getActiveFeatureDetails={ noFeatureDetails }
			/>
		);

		const shown = [ 'Carousel card', 'Carousel pointer' ].filter( text =>
			screen.queryByText( text )
		);
		expect( shown ).toEqual( expected );
	} );
} );
