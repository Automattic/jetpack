import { render, screen } from 'test/test-utils';
import { Performance } from '../index';

jest.mock( 'components/data/query-site', () => () => null );
jest.mock( '../media', () => () => <div>VideoPress card</div> );
jest.mock( '../search', () => () => <div>Search card</div> );
jest.mock( '../speed-up-site', () => () => null );

const findsEverything = () => true;
const findsOnlyVideoPress = module => module === 'videopress';
const CARDS = [ 'Search card', 'VideoPress card' ];

describe( 'Performance settings', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it.each( [
		[ CARDS, 'on the tab while the settings flag is off', false, {} ],
		[ [ 'Search card' ], 'on the tab once the settings flag is on', true, {} ],
	] )( 'shows %p %s', ( expected, _label, flag, props ) => {
		window.JetpackScriptData = { myJetpack: { settingsConsolidation: flag } };

		render( <Performance active isModuleFound={ findsEverything } { ...props } /> );

		expect( CARDS.filter( card => screen.queryByText( card ) ) ).toEqual( expected );
	} );

	it( 'renders nothing for a VideoPress search once the settings flag is on', () => {
		window.JetpackScriptData = { myJetpack: { settingsConsolidation: true } };

		const { container } = render(
			<Performance searchTerm="videopress" isModuleFound={ findsOnlyVideoPress } />
		);

		expect( container ).toBeEmptyDOMElement();
	} );
} );
