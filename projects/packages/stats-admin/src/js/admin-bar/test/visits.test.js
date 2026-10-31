import { parseVisits } from '../visits';

const fields = [ 'period', 'views', 'visitors' ];

describe( 'parseVisits', () => {
	it( 'reads views and visitors by column name, oldest first', () => {
		const data = [ 1, 2, 3, 4, 5, 6, 7 ].map( day => [ `2026-10-2${ day }`, day * 10, day ] );

		expect(
			parseVisits( {
				fields: [ 'visitors', 'period', 'views' ],
				data: data.map( ( [ p, v, u ] ) => [ u, p, v ] ),
			} )
		).toEqual( {
			views: [ 10, 20, 30, 40, 50, 60, 70 ],
			visitors: [ 1, 2, 3, 4, 5, 6, 7 ],
		} );
	} );

	it( 'fills days before the first row with 0', () => {
		const data = [
			[ '2026-10-26', 4, 2 ],
			[ '2026-10-27', 18, 9 ],
			[ '2026-10-28', 31, 15 ],
		];

		expect( parseVisits( { fields, data } ).views ).toEqual( [ 0, 0, 0, 0, 4, 18, 31 ] );
	} );

	it.each( [
		[ 'no data', { fields } ],
		[ 'no fields', { data: [] } ],
		[ 'no visitors column', { fields: [ 'period', 'views' ], data: [] } ],
	] )( 'throws on a response with %s, instead of showing zero traffic', ( _, body ) => {
		expect( () => parseVisits( body ) ).toThrow();
	} );
} );
