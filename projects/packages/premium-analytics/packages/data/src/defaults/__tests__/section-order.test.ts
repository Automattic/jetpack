/**
 * External dependencies
 */
import { dispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
/**
 * Internal dependencies
 */
import { getSectionOrder, orderSections, setSectionOrder } from '../section-order';

const SCOPE = 'jetpack-premium-analytics/test';
const SECTIONS = [ 'traffic', 'insights', 'subscribers', 'ads' ].map( slug => ( { slug } ) );

afterEach( () => {
	dispatch( preferencesStore ).set( SCOPE, 'sectionOrder', undefined );
} );

describe( 'orderSections', () => {
	it.each( [
		[
			'the named sections first, the rest as given',
			[ 'subscribers', 'traffic' ],
			[ 'subscribers', 'traffic', 'insights', 'ads' ],
		],
		[
			'past a slug that has no section',
			[ 'woocommerce', 'ads' ],
			[ 'ads', 'traffic', 'insights', 'subscribers' ],
		],
	] )( 'puts %s', ( _case, order, expected ) => {
		expect( orderSections( SECTIONS, order ).map( section => section.slug ) ).toEqual( expected );
	} );

	it( 'hands back the same list when the reader gave no order', () => {
		expect( orderSections( SECTIONS, [] ) ).toBe( SECTIONS );
	} );
} );

describe( 'getSectionOrder', () => {
	it( 'reads the order stored for the scope, and none for another', () => {
		setSectionOrder( SCOPE, [ 'insights', 'traffic' ] );

		expect( getSectionOrder( SCOPE ) ).toEqual( [ 'insights', 'traffic' ] );
		expect( getSectionOrder( `${ SCOPE }/other` ) ).toEqual( [] );
	} );

	it.each( [ [ 'insights' ], [ [ 'insights', 3 ] ], [ { insights: 0 } ] ] )(
		'reads a stored %p as no order',
		stored => {
			dispatch( preferencesStore ).set( SCOPE, 'sectionOrder', stored );

			expect( getSectionOrder( SCOPE ) ).toEqual( [] );
		}
	);
} );

describe( 'setSectionOrder', () => {
	it.each( [
		[ 'first', [ 'ads', 'traffic', 'insights' ], [ 'ads', 'insights', 'traffic' ] ],
		[ 'in the middle', [ 'traffic', 'ads', 'insights' ], [ 'insights', 'ads', 'traffic' ] ],
		[ 'last', [ 'traffic', 'insights', 'ads' ], [ 'insights', 'traffic', 'ads' ] ],
		[
			'with a tab the stored order did not name',
			[ 'ads', 'traffic' ],
			[ 'ads', 'insights', 'traffic' ],
		],
	] )(
		'keeps the position of a stored slug the new order leaves out, %s',
		( _case, stored, expected ) => {
			setSectionOrder( SCOPE, stored );

			setSectionOrder( SCOPE, [ 'insights', 'traffic' ] );

			expect( getSectionOrder( SCOPE ) ).toEqual( expected );
		}
	);

	it( 'forgets the order when given none', () => {
		setSectionOrder( SCOPE, [ 'insights', 'traffic' ] );

		setSectionOrder( SCOPE );

		expect( getSectionOrder( SCOPE ) ).toEqual( [] );
	} );
} );
