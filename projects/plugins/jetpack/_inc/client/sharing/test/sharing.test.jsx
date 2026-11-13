import { render, screen } from 'test/test-utils';
import { Sharing } from '../index';

jest.mock( 'components/data/query-site', () => () => null );
jest.mock( 'components/pointer-card', () => ( {
	FeaturesPointer: ( { search } ) => <div>{ `Features pointer: ${ search }` }</div>,
} ) );
jest.mock( '../likes', () => ( { Likes: () => <div>Like buttons card</div> } ) );
jest.mock( '../publicize', () => ( { Publicize: () => <div>Social card</div> } ) );
jest.mock( '../share-buttons', () => ( { ShareButtons: () => <div>Sharing buttons card</div> } ) );

const CARDS = [ 'Social card', 'Sharing buttons card', 'Like buttons card' ];
const POINTERS = [ 'social', 'sharing', 'likes' ].map( term => `Features pointer: ${ term }` );
const getModule = () => ( { name: 'Module name' } );
const findsOnly = Object.fromEntries(
	[ 'publicize', 'sharedaddy', 'likes' ].map( slug => [ slug, module => module === slug ] )
);
const findsAll = () => true;

describe( 'Sharing settings', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it.each( [
		[ 'publicize', 'the Social card while the settings flag is off', false, true, 'Social card' ],
		[
			'publicize',
			'a pointer to Features for admins once the flag is on',
			true,
			true,
			'Features pointer: social',
		],
		[
			'publicize',
			'the Social card for users who cannot manage modules',
			true,
			false,
			'Social card',
		],
		[
			'sharedaddy',
			'its card while the settings flag is off',
			false,
			true,
			'Sharing buttons card',
		],
		[
			'sharedaddy',
			'a pointer to Features once the flag is on',
			true,
			true,
			'Features pointer: sharing',
		],
		[ 'likes', 'its card while the settings flag is off', false, true, 'Like buttons card' ],
		[ 'likes', 'a pointer to Features once the flag is on', true, true, 'Features pointer: likes' ],
	] )( 'a %s search shows %s', ( module, _label, flag, canManageModules, expected ) => {
		window.JetpackScriptData = { myJetpack: { settingsConsolidation: flag } };

		render(
			<Sharing
				searchTerm={ module }
				module={ getModule }
				isModuleFound={ findsOnly[ module ] }
				userCanManageModules={ canManageModules }
			/>
		);

		const shown = [ ...CARDS, ...POINTERS ].filter( text => screen.queryByText( text ) );
		expect( shown ).toEqual( [ expected ] );
	} );

	it.each( [
		[ 'shows nothing to admins', true, [] ],
		[ 'keeps the cards for users who cannot manage modules', false, CARDS ],
	] )(
		'outside a search, once the settings flag is on, the tab %s',
		( _label, canManageModules, expected ) => {
			window.JetpackScriptData = { myJetpack: { settingsConsolidation: true } };

			render(
				<Sharing
					active
					module={ getModule }
					isModuleFound={ findsAll }
					userCanManageModules={ canManageModules }
				/>
			);

			const shown = [ ...CARDS, ...POINTERS ].filter( text => screen.queryByText( text ) );
			expect( shown ).toEqual( expected );
		}
	);
} );
