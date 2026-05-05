import { hashRenderItems, type RenderItem } from '../../../utils/render-messages';
import { getRenderedMessages } from '../rendered-messages';
import type { RenderedMessages, SocialStoreState } from '../../types';

const item = ( id: string, message = '' ): RenderItem => ( {
	id,
	network: 'x',
	message,
	is_social_post: false,
} );

const stateWith = ( renderedMessages: RenderedMessages ): SocialStoreState =>
	( { connectionData: { connections: [] }, renderedMessages } ) as SocialStoreState;

describe( 'getRenderedMessages', () => {
	it( 'returns undefined when postId is missing', () => {
		expect( getRenderedMessages( stateWith( {} ), 0, [ item( 'a' ) ] ) ).toBeUndefined();
	} );

	it( 'returns undefined when items is empty', () => {
		expect( getRenderedMessages( stateWith( {} ), 42, [] ) ).toBeUndefined();
	} );

	it( 'reads the batch stored under the cache key for these items', () => {
		const items = [ item( 'a' ), item( 'b' ) ];
		const cacheKey = `42|${ hashRenderItems( items ) }`;
		const batch = { a: { rendered_message: 'A' }, b: { rendered_message: 'B' } };

		const state = stateWith( { [ cacheKey ]: batch } );

		expect( getRenderedMessages( state, 42, items ) ).toBe( batch );
	} );

	it( 'returns the original cached batch when items revert to a prior shape', () => {
		// Simulates the reviewer's regression: typing "A" → "B" → "A" must read
		// "A"'s original cached batch, not "B"'s overwriting it.
		const itemsA = [ item( 'a', 'A' ) ];
		const itemsB = [ item( 'a', 'B' ) ];

		const state = stateWith( {
			[ `42|${ hashRenderItems( itemsA ) }` ]: { a: { rendered_message: 'rendered-A' } },
			[ `42|${ hashRenderItems( itemsB ) }` ]: { a: { rendered_message: 'rendered-B' } },
		} );

		expect( getRenderedMessages( state, 42, itemsA )?.a.rendered_message ).toBe( 'rendered-A' );
		expect( getRenderedMessages( state, 42, itemsB )?.a.rendered_message ).toBe( 'rendered-B' );
		// Reverting reads the original — no collision.
		expect( getRenderedMessages( state, 42, itemsA )?.a.rendered_message ).toBe( 'rendered-A' );
	} );
} );
