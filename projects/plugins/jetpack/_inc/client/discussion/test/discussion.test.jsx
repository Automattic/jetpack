import { render, screen } from 'test/test-utils';
import Discussion from '../index';

jest.mock( 'components/data/query-site', () => () => null );
jest.mock( '../comments', () => ( { Comments: () => <p>Comments card</p> } ) );
jest.mock( '../comments-moved', () => ( { CommentsMoved: () => <p>Comments pointer</p> } ) );
jest.mock( 'components/pointer-card', () => ( {
	FeaturesPointer: ( { search } ) => <p>{ `Features pointer: ${ search }` }</p>,
} ) );

const MODULES = {
	comments: { module: 'comments', name: 'Comments' },
	'gravatar-hovercards': { module: 'gravatar-hovercards', name: 'Gravatar Hovercards' },
	'comment-likes': { module: 'comment-likes', name: 'Comment Likes' },
	markdown: { module: 'markdown', name: 'Markdown' },
};

const renderDiscussion = ( { flag, searchTerm = '', canManageModules = true } ) => {
	window.JetpackScriptData = { myJetpack: { settingsConsolidation: flag } };
	return render( <Discussion active={ ! searchTerm } searchTerm={ searchTerm } />, {
		initialState: {
			jetpack: {
				connection: {
					status: { siteConnected: { isActive: true, offlineMode: { isActive: false } } },
					user: { currentUser: { isConnected: true } },
				},
				initialState: {
					siteData: {},
					userData: { currentUser: { permissions: { manage_modules: canManageModules } } },
				},
				modules: { items: MODULES },
				search: { searchTerm },
				settings: { items: {} },
			},
		},
	} );
};

describe( 'Discussion settings', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it.each( [
		[ 'the card on the tab with the settings flag off', false, '', true, [ 'Comments card' ] ],
		[ 'nothing on the tab once the flag is on', true, '', true, [] ],
		[ 'the panel pointer for a Comments search', true, 'comments', true, [ 'Comments pointer' ] ],
		[
			'the Features row for a Gravatar search',
			true,
			'gravatar',
			true,
			[ 'Features pointer: Gravatar Hovercards' ],
		],
		[
			'the Features row for a Comment Likes search',
			true,
			'comment likes',
			true,
			[ 'Features pointer: Comment Likes' ],
		],
		[
			'the card to a user who cannot manage modules',
			true,
			'comments',
			false,
			[ 'Comments card' ],
		],
	] )( 'shows %s', ( _name, flag, searchTerm, canManageModules, expected ) => {
		renderDiscussion( { flag, searchTerm, canManageModules } );

		const shown = [
			'Comments card',
			'Comments pointer',
			'Features pointer: Gravatar Hovercards',
			'Features pointer: Comment Likes',
		].filter( text => screen.queryByText( text ) );
		expect( shown ).toEqual( expected );
	} );

	it( 'renders nothing for a Markdown search once the flag is on, since Writing points to it', () => {
		const { container } = renderDiscussion( { flag: true, searchTerm: 'markdown' } );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
