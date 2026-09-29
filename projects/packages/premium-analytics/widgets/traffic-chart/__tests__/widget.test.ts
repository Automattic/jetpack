/**
 * Internal dependencies
 */
import widget, { MOBILE_QUERY } from '../widget';

function chartTypeSwitchValue( item: { chartType?: 'line' | 'bar' } ) {
	const field = widget.attributes.find( attribute => attribute.id === 'chartType' );
	return ( field as unknown as { getValue: ( args: { item: object } ) => unknown } ).getValue( {
		item,
	} );
}

function mockViewport( isMobile: boolean ) {
	window.matchMedia = jest.fn( query => ( {
		matches: isMobile && query === MOBILE_QUERY,
	} ) ) as never;
}

describe( 'Traffic chart type switch', () => {
	it.each( [
		[ false, 'bar' ],
		[ true, 'line' ],
	] )(
		'shows the default the chart draws when nothing is saved (mobile: %s)',
		( isMobile, expected ) => {
			mockViewport( isMobile );

			expect( chartTypeSwitchValue( {} ) ).toBe( expected );
		}
	);

	it( 'shows a saved choice whatever the viewport', () => {
		mockViewport( true );

		expect( chartTypeSwitchValue( { chartType: 'bar' } ) ).toBe( 'bar' );
	} );
} );
