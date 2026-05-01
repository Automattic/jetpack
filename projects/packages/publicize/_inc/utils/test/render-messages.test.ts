/* eslint-disable testing-library/render-result-naming-convention */
import { chunkRenderItems, DEFAULT_CHUNK_BYTE_BUDGET } from '../render-messages';
import type { RenderItem } from '../render-messages';

const item = ( overrides: Partial< RenderItem > = {} ): RenderItem => ( {
	id: 'a',
	network: 'x',
	message: '',
	is_social_post: false,
	...overrides,
} );

describe( 'chunkRenderItems', () => {
	it( 'returns nothing when given an empty list', () => {
		expect( chunkRenderItems( [] ) ).toEqual( [] );
	} );

	it( 'fits a small batch into a single chunk', () => {
		const items = [ item( { id: '1' } ), item( { id: '2' } ), item( { id: '3' } ) ];
		const split = chunkRenderItems( items );

		expect( split ).toHaveLength( 1 );
		expect( split[ 0 ] ).toEqual( items );
	} );

	it( 'splits a batch when the cumulative payload exceeds the budget', () => {
		// Build items whose individual JSON size is ~120 bytes; budget=300 forces split of 2.
		const longMessage = 'x'.repeat( 100 );
		const items = Array.from( { length: 5 }, ( _, i ) =>
			item( { id: String( i ), message: longMessage } )
		);

		const split = chunkRenderItems( items, 300 );

		expect( split.length ).toBeGreaterThan( 1 );
		// Every chunk's payload stays under budget.
		for ( const chunk of split ) {
			const size = chunk.reduce( ( acc, it ) => acc + JSON.stringify( it ).length, 0 );
			expect( size ).toBeLessThanOrEqual( 300 );
		}
		// All items survive the split, in order.
		expect( split.flat().map( c => c.id ) ).toEqual( items.map( i => i.id ) );
	} );

	it( 'allows a single oversized item to occupy its own chunk', () => {
		const oversized = item( { id: 'big', message: 'x'.repeat( 1000 ) } );
		const small = item( { id: 'small' } );

		const split = chunkRenderItems( [ oversized, small ], 100 );

		expect( split ).toHaveLength( 2 );
		expect( split[ 0 ] ).toEqual( [ oversized ] );
		expect( split[ 1 ] ).toEqual( [ small ] );
	} );

	it( 'uses DEFAULT_CHUNK_BYTE_BUDGET when no budget is supplied', () => {
		const small = Array.from( { length: 10 }, ( _, i ) => item( { id: String( i ) } ) );
		// All items fit comfortably in the default budget — single chunk.
		expect( chunkRenderItems( small ) ).toHaveLength( 1 );

		const totalBytes = small.reduce( ( acc, it ) => acc + JSON.stringify( it ).length, 0 );
		expect( totalBytes ).toBeLessThan( DEFAULT_CHUNK_BYTE_BUDGET );
	} );
} );
