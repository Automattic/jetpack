import { render, screen } from 'test/test-utils';
import { Performance } from '../index';

jest.mock( 'components/data/query-site', () => () => null );
jest.mock( 'components/pointer-card', () => ( {
	FeaturesPointer: ( { search, linksToSettings = true } ) => (
		<div>{ `Features pointer: ${ search }${ linksToSettings ? '' : ', switch only' }` }</div>
	),
} ) );
jest.mock( '../media', () => () => <div>VideoPress card</div> );
jest.mock( '../search', () => () => <div>Search card</div> );
jest.mock(
	'../speed-up-site',
	() =>
		( { isModuleFound } ) =>
			isModuleFound( 'photon' ) || isModuleFound( 'photon-cdn' ) ? <div>Image CDN card</div> : null
);

const findsEverything = () => true;
const findsOnlyVideoPress = module => module === 'videopress';
const findsOnlySearch = module => module === 'search';
const CARDS = [ 'Search card', 'Image CDN card', 'VideoPress card' ];

describe( 'Performance settings', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it.each( [
		[ CARDS, 'on the tab while the settings flag is off', false, {} ],
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

	it.each( [
		[ 'videopress', findsOnlyVideoPress, 'VideoPress card', 'videopress' ],
		[ 'site accelerator', module => module === 'photon-cdn', 'Image CDN card', 'cdn, switch only' ],
	] )(
		'points a %p search to Features once the settings flag is on',
		( searchTerm, isModuleFound, card, pointer ) => {
			window.JetpackScriptData = { myJetpack: { settingsConsolidation: true } };

			render( <Performance searchTerm={ searchTerm } isModuleFound={ isModuleFound } /> );

			expect( screen.getByText( `Features pointer: ${ pointer }` ) ).toBeInTheDocument();
			expect( screen.queryByText( card ) ).not.toBeInTheDocument();
		}
	);

	it( 'renders nothing on the tab once the settings flag is on', () => {
		window.JetpackScriptData = { myJetpack: { settingsConsolidation: true } };

		const { container } = render( <Performance active isModuleFound={ findsEverything } /> );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
