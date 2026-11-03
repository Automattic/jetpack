import { render, screen } from 'test/test-utils';
import { Writing } from '../index';

jest.mock( 'components/data/query-site', () => () => null );
jest.mock( '../composing', () => () => null );
jest.mock( '../custom-content-types', () => () => null );
jest.mock( '../post-by-email', () => () => null );
jest.mock( '../theme-enhancements', () => () => null );
jest.mock( '../widgets', () => () => null );
jest.mock( '../writing-media', () => () => 'Carousel card' );
jest.mock( '../carousel-moved', () => ( { CarouselMoved: () => 'Carousel pointer' } ) );

// Module scope keeps the prop references stable (react/jsx-no-bind).
const findsOnlyCarousel = module => module === 'carousel';
// Never settles, so the custom content types lookup changes no state after the test.
const noFeatureDetails = () => new Promise( () => undefined );

describe( 'Writing settings', () => {
	it.each( [
		[ 'off, in the tab', false, '', [ 'Carousel card' ] ],
		[ 'off, in a search', false, 'carousel', [ 'Carousel card' ] ],
		[ 'on, in the tab', true, '', [] ],
		[ 'on, in a search', true, 'carousel', [ 'Carousel pointer' ] ],
	] )( 'with the settings flag %s', ( _name, flag, searchTerm, expected ) => {
		window.JetpackScriptData = { myJetpack: { settingsConsolidation: flag } };
		try {
			render(
				<Writing
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
		} finally {
			delete window.JetpackScriptData;
		}
	} );
} );
