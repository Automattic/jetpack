import { hashRenderItems, type RenderItem } from '../render-messages';

const item = ( overrides: Partial< RenderItem > = {} ): RenderItem => ( {
	id: 'a',
	network: 'x',
	message: '',
	is_social_post: false,
	...overrides,
} );

describe( 'hashRenderItems', () => {
	it( 'is empty-input safe', () => {
		expect( hashRenderItems( [] ) ).toBe( '[]' );
	} );

	it( 'produces the same hash for equivalent inputs', () => {
		const a = [ item( { id: '1', message: 'hello' } ) ];
		const b = [ item( { id: '1', message: 'hello' } ) ];
		expect( hashRenderItems( a ) ).toBe( hashRenderItems( b ) );
	} );

	it( 'differs when message changes', () => {
		const a = [ item( { id: '1', message: 'hello' } ) ];
		const b = [ item( { id: '1', message: 'world' } ) ];
		expect( hashRenderItems( a ) ).not.toBe( hashRenderItems( b ) );
	} );

	it( 'differs when items are reordered', () => {
		const ab = [ item( { id: 'a' } ), item( { id: 'b' } ) ];
		const ba = [ item( { id: 'b' } ), item( { id: 'a' } ) ];
		expect( hashRenderItems( ab ) ).not.toBe( hashRenderItems( ba ) );
	} );

	it( 'distinguishes ["a","b"] from ["ab"] (no separator collision)', () => {
		const split = [ item( { id: '1', message: 'a' } ), item( { id: '2', message: 'b' } ) ];
		const joined = [ item( { id: '1', message: 'ab' } ) ];
		expect( hashRenderItems( split ) ).not.toBe( hashRenderItems( joined ) );
	} );

	it( 'normalises missing message and is_social_post defaults', () => {
		const explicit = [ item( { id: '1', message: '', is_social_post: false } ) ];
		const implicit = [ { id: '1', network: 'x' } as RenderItem ];
		expect( hashRenderItems( explicit ) ).toBe( hashRenderItems( implicit ) );
	} );
} );
