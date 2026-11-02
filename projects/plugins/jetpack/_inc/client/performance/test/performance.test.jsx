import { render, screen } from 'test/test-utils';
import { Performance } from '../index';

jest.mock( 'components/data/query-site', () => () => null );
jest.mock( 'components/pointer-card', () => ( {
	FeaturesPointer: ( { search } ) => <div>{ `Features pointer: ${ search }` }</div>,
} ) );
jest.mock( '../media', () => () => <div>VideoPress card</div> );
jest.mock( '../search', () => () => <div>Search card</div> );
jest.mock( '../speed-up-site', () => () => null );

const findsEverything = () => true;
const findsOnlyVideoPress = module => module === 'videopress';
const findsOnlySearch = module => module === 'search';
const CARDS = [ 'Search card', 'VideoPress card' ];

describe( 'Performance settings', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it.each( [
		[ CARDS, 'on the tab while the settings flag is off', false, {} ],
		[ [], 'on the tab once the settings flag is on', true, {} ],
		[
			[ 'Search card' ],
			'for a Search search once the settings flag is on',
			true,
			{ searchTerm: 'search', isModuleFound: findsOnlySearch },
		],
	] )( 'shows %p %s', ( expected, _label, flag, props ) => {
		window.JetpackScriptData = { myJetpack: { settingsConsolidation: flag } };

		render( <Performance active isModuleFound={ findsEverything } { ...props } /> );

		expect( CARDS.filter( card => screen.queryByText( card ) ) ).toEqual( expected );
	} );

	it( 'points a VideoPress search to Features once the settings flag is on', () => {
		window.JetpackScriptData = { myJetpack: { settingsConsolidation: true } };

		render( <Performance searchTerm="videopress" isModuleFound={ findsOnlyVideoPress } /> );

		expect( screen.getByText( 'Features pointer: videopress' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'VideoPress card' ) ).not.toBeInTheDocument();
	} );
} );
