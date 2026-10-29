/**
 * Internal dependencies
 */
import { isDashboardSectionAvailable, isPostDetailAvailable } from '../dashboard-sections';

function setScriptData( data: Record< string, unknown > ) {
	Object.defineProperty( window, 'JetpackScriptData', {
		configurable: true,
		value: data,
	} );
}

afterEach( () => {
	delete window.JetpackScriptData;
} );

describe( 'isDashboardSectionAvailable', () => {
	it( 'reads the exposed tabs from the published list', () => {
		setScriptData( { premium_analytics: { sections: [ 'traffic' ] } } );

		expect( isDashboardSectionAvailable( 'traffic' ) ).toBe( true );
		expect( isDashboardSectionAvailable( 'insights' ) ).toBe( false );
	} );

	it.each( [
		[ 'the list is absent', { premium_analytics: { has_videopress: true } } ],
		[ 'no script data was published', {} ],
	] )( 'exposes every tab when %s', ( _case, data ) => {
		setScriptData( data );

		expect( isDashboardSectionAvailable( 'insights' ) ).toBe( true );
	} );

	it( 'exposes no tab when the published list is empty', () => {
		setScriptData( { premium_analytics: { sections: [] } } );

		expect( isDashboardSectionAvailable( 'traffic' ) ).toBe( false );
	} );
} );

describe( 'isPostDetailAvailable', () => {
	it.each( [
		[ [ 'woocommerce', 'traffic' ], true ],
		[ [ 'woocommerce' ], false ],
	] )( 'opens post details only when %j includes their tab', ( sections, expected ) => {
		setScriptData( { premium_analytics: { sections } } );

		expect( isPostDetailAvailable() ).toBe( expected );
	} );
} );
