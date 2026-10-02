/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
/**
 * Internal dependencies
 */
import widget from '../widget';

jest.mock( '@automattic/jetpack-script-data', () => ( { getScriptData: jest.fn() } ) );

beforeEach( () => {
	window.localStorage.clear();
	jest.mocked( getScriptData ).mockReturnValue( { site: { wpcom: { blog_id: 123 } } } as never );
} );

function chartTypeSwitchValue( item: { chartType?: 'line' | 'bar' } ) {
	const field = widget.attributes.find( attribute => attribute.id === 'chartType' );
	return ( field as unknown as { getValue: ( args: { item: object } ) => unknown } ).getValue( {
		item,
	} );
}

describe( 'Traffic chart type switch', () => {
	it( 'shows bars when nothing is saved', () => {
		expect( chartTypeSwitchValue( {} ) ).toBe( 'bar' );
	} );

	it( 'shows a saved choice', () => {
		expect( chartTypeSwitchValue( { chartType: 'line' } ) ).toBe( 'line' );
	} );

	it( 'shows the choice Stats v1 saved when nothing is saved here', () => {
		window.localStorage.setItem( 'jetpack_stats_chart_type_123', 'line' );

		expect( chartTypeSwitchValue( {} ) ).toBe( 'line' );
	} );
} );
