import { hashRenderItems, type RenderItem } from '../render-messages';

const item = ( overrides: Partial< RenderItem > = {} ): RenderItem => ( {
	connection_id: 'a',
	message: '',
	is_social_post: false,
	...overrides,
} );

describe( 'hashRenderItems', () => {
	it( 'is empty-input safe', () => {
		expect( hashRenderItems( [] ) ).toBe( '[]' );
	} );

	it( 'produces the same hash for equivalent inputs', () => {
		const a = [ item( { connection_id: '1', message: 'hello' } ) ];
		const b = [ item( { connection_id: '1', message: 'hello' } ) ];
		expect( hashRenderItems( a ) ).toBe( hashRenderItems( b ) );
	} );

	it( 'differs when message changes', () => {
		const a = [ item( { connection_id: '1', message: 'hello' } ) ];
		const b = [ item( { connection_id: '1', message: 'world' } ) ];
		expect( hashRenderItems( a ) ).not.toBe( hashRenderItems( b ) );
	} );

	it( 'differs when edited post intent changes', () => {
		expect( hashRenderItems( [ item() ], { title: 'First title' } ) ).not.toBe(
			hashRenderItems( [ item() ], { title: 'Updated title' } )
		);
	} );

	it( 'differs when items are reordered', () => {
		const ab = [ item( { connection_id: 'a' } ), item( { connection_id: 'b' } ) ];
		const ba = [ item( { connection_id: 'b' } ), item( { connection_id: 'a' } ) ];
		expect( hashRenderItems( ab ) ).not.toBe( hashRenderItems( ba ) );
	} );

	it( 'distinguishes ["a","b"] from ["ab"] (no separator collision)', () => {
		const split = [
			item( { connection_id: '1', message: 'a' } ),
			item( { connection_id: '2', message: 'b' } ),
		];
		const joined = [ item( { connection_id: '1', message: 'ab' } ) ];
		expect( hashRenderItems( split ) ).not.toBe( hashRenderItems( joined ) );
	} );

	it( 'normalises missing message and is_social_post defaults', () => {
		const explicit = [ item( { connection_id: '1', message: '', is_social_post: false } ) ];
		const implicit = [ { connection_id: '1' } as RenderItem ];
		expect( hashRenderItems( explicit ) ).toBe( hashRenderItems( implicit ) );
	} );
} );
