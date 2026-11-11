import { act, render, screen } from 'test/test-utils';
import Writing, { Writing as UnconnectedWriting } from '../index';

jest.mock( 'components/data/query-site', () => () => null );
jest.mock( 'state/feature-check', () => ( {
	getActiveFeatureDetails: () => () => new Promise( () => {} ),
} ) );
jest.mock( '../composing', () => () => null );
jest.mock( '../custom-content-types', () => () => <p>Custom content types card</p> );
jest.mock( '../custom-content-types-moved', () => ( {
	CustomContentTypesMoved: () => <p>Custom content types pointer</p>,
} ) );
jest.mock( '../post-by-email', () => () => 'Post by Email card' );
jest.mock( '../post-by-email-moved', () => ( {
	PostByEmailMoved: () => 'Post by Email pointer',
} ) );
jest.mock( '../theme-enhancements', () => () => <p>Infinite Scroll card</p> );
jest.mock( '../widgets', () => () => null );
jest.mock( '../writing-media', () => () => <p>Carousel card</p> );
jest.mock( '../carousel-moved', () => ( { CarouselMoved: () => <p>Carousel pointer</p> } ) );
jest.mock( '../infinite-scroll-moved', () => ( {
	InfiniteScrollMoved: () => <p>Infinite Scroll pointer</p>,
} ) );

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
const findsOnly = {
	carousel: module => module === 'carousel',
	'infinite-scroll': module => module === 'infinite-scroll',
	'post-by-email': module => module === 'post-by-email',
	// Any custom content types search finds their module, which the tab's found list leaves out.
	portfolio: module => module === 'custom-content-types',
};
// Outside a search, the tab finds every module it lists.
const findsEvery = () => true;
// Never settles, so the custom content types lookup changes no state after the test.
const noFeatureDetails = () => new Promise( () => undefined );
const customContentTypeDetails = () =>
	Promise.resolve( {
		'custom-content-types': {
			active: true,
			over_ride: false,
			additional_search_queries: 'cpt, portfolio, testimonial',
			description: 'Display different types of content.',
		},
	} );
const isActive = () => true;

describe( 'Writing settings', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
		delete window.CUSTOM_CONTENT_TYPE__INITIAL_STATE;
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
		[
			'renders nothing',
			'on the tab once the flag is on, with custom content types',
			true,
			'',
			false,
			LATEX,
			false,
			true,
		],
	] )(
		'%s for a site whose only Writing module Features switches, %s',
		(
			_verb,
			_when,
			flag,
			searchTerm,
			shown,
			modules = LATEX,
			isBlockTheme = false,
			customContentTypes = false
		) => {
			window.JetpackScriptData = { myJetpack: { settingsConsolidation: flag } };
			window.CUSTOM_CONTENT_TYPE__INITIAL_STATE = { active: customContentTypes };

			const { container } = render( <Writing active searchTerm={ searchTerm } />, {
				initialState: buildState( searchTerm, modules, isBlockTheme ),
			} );

			expect( container.childElementCount > 0 ).toBe( shown );
		}
	);

	// The Infinite Scroll card renders without a found check, so its mock shows for every row.
	describe.each( [
		[ 'Carousel', 'carousel' ],
		[ 'Infinite Scroll', 'infinite-scroll' ],
		[ 'Post by Email', 'post-by-email' ],
		[
			'Custom content types',
			'portfolio',
			customContentTypeDetails,
			// The REST keywords lack the card's own title.
			[
				[
					'on, in a search for its title',
					true,
					'custom content types',
					[ 'Custom content types pointer' ],
				],
			],
		],
	] )( '%s', ( name, slug, featureDetails = noFeatureDetails, extraRows = [] ) => {
		it.each( [
			[ 'off, in the tab', false, '', [ `${ name } card` ] ],
			[ 'off, in a search', false, slug, [ `${ name } card` ] ],
			[ 'on, in the tab', true, '', [] ],
			[ 'on, in a search', true, slug, [ `${ name } pointer` ] ],
			...extraRows,
		] )( 'with the settings flag %s', async ( _name, flag, searchTerm, expected ) => {
			window.JetpackScriptData = { myJetpack: { settingsConsolidation: flag } };
			render(
				<UnconnectedWriting
					active
					userCanManageModules
					searchTerm={ searchTerm }
					isModuleFound={ searchTerm ? findsOnly[ slug ] : findsEvery }
					getActiveFeatureDetails={ featureDetails }
				/>
			);
			// Lets the custom content types lookup settle.
			await act( () => Promise.resolve() );

			const shown = [ `${ name } card`, `${ name } pointer` ].filter( text =>
				screen.queryByText( text )
			);
			expect( shown ).toEqual( expected );
		} );
	} );

	it.each( [
		[ 'in the tab', '' ],
		[ 'in a search', 'post-by-email' ],
	] )(
		'keeps the Post by Email card, %s, for a user who cannot manage modules',
		( _name, searchTerm ) => {
			window.JetpackScriptData = { myJetpack: { settingsConsolidation: true } };
			render(
				<UnconnectedWriting
					active
					userCanEditPosts
					searchTerm={ searchTerm }
					isModuleFound={ findsOnly[ 'post-by-email' ] }
					isModuleActivated={ isActive }
					getActiveFeatureDetails={ noFeatureDetails }
				/>
			);

			expect( screen.getByText( 'Post by Email card' ) ).toBeInTheDocument();
		}
	);
} );
