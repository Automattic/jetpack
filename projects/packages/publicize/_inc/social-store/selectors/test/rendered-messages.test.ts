import { renderMessagesCacheKey, type RenderItem } from '../../../utils/render-messages';
import { getRenderedMessages, isLoadingRenderedMessages } from '../rendered-messages';
import type { RenderedMessages, SocialStoreState } from '../../types';

const item = ( connection_id: string, message = '' ): RenderItem => ( {
	connection_id,
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
		const batch = { a: { rendered_message: 'A' }, b: { rendered_message: 'B' } };

		const state = stateWith( {
			[ renderMessagesCacheKey( 42, items ) ]: { isLoading: false, items: batch },
		} );

		expect( getRenderedMessages( state, 42, items ) ).toBe( batch );
	} );

	it( 'returns the original cached batch when items revert to a prior shape', () => {
		// Simulates the reviewer's regression: typing "A" → "B" → "A" must read
		// "A"'s original cached batch, not "B"'s overwriting it.
		const itemsA = [ item( 'a', 'A' ) ];
		const itemsB = [ item( 'a', 'B' ) ];

		const state = stateWith( {
			[ renderMessagesCacheKey( 42, itemsA ) ]: {
				isLoading: false,
				items: { a: { rendered_message: 'rendered-A' } },
			},
			[ renderMessagesCacheKey( 42, itemsB ) ]: {
				isLoading: false,
				items: { a: { rendered_message: 'rendered-B' } },
			},
		} );

		expect( getRenderedMessages( state, 42, itemsA )?.a.rendered_message ).toBe( 'rendered-A' );
		expect( getRenderedMessages( state, 42, itemsB )?.a.rendered_message ).toBe( 'rendered-B' );
		// Reverting reads the original — no collision.
		expect( getRenderedMessages( state, 42, itemsA )?.a.rendered_message ).toBe( 'rendered-A' );
	} );

	it( 'stores separate batches for different post intent values', () => {
		const items = [ item( 'a', '{title}' ) ];

		const state = stateWith( {
			[ renderMessagesCacheKey( 42, items, { title: 'A' } ) ]: {
				isLoading: false,
				items: { a: { rendered_message: 'rendered-A' } },
			},
			[ renderMessagesCacheKey( 42, items, { title: 'B' } ) ]: {
				isLoading: false,
				items: { a: { rendered_message: 'rendered-B' } },
			},
		} );

		expect( getRenderedMessages( state, 42, items, { title: 'A' } )?.a.rendered_message ).toBe(
			'rendered-A'
		);
		expect( getRenderedMessages( state, 42, items, { title: 'B' } )?.a.rendered_message ).toBe(
			'rendered-B'
		);
	} );
} );

describe( 'isLoadingRenderedMessages', () => {
	it( 'returns false when postId is missing', () => {
		expect( isLoadingRenderedMessages( stateWith( {} ), 0, [ item( 'a' ) ] ) ).toBe( false );
	} );

	it( 'returns false when items is empty', () => {
		expect( isLoadingRenderedMessages( stateWith( {} ), 42, [] ) ).toBe( false );
	} );

	it( 'returns true when no entry exists yet — closes the flash window before the resolver dispatches start', () => {
		expect( isLoadingRenderedMessages( stateWith( {} ), 42, [ item( 'a' ) ] ) ).toBe( true );
	} );

	it( 'returns true while the resolver has marked the cache slot as loading', () => {
		const items = [ item( 'a' ) ];
		const state = stateWith( {
			[ renderMessagesCacheKey( 42, items ) ]: { isLoading: true },
		} );
		expect( isLoadingRenderedMessages( state, 42, items ) ).toBe( true );
	} );

	it( 'returns false once the resolver clears loading', () => {
		const items = [ item( 'a' ) ];
		const state = stateWith( {
			[ renderMessagesCacheKey( 42, items ) ]: {
				isLoading: false,
				items: { a: { rendered_message: 'A' } },
			},
		} );
		expect( isLoadingRenderedMessages( state, 42, items ) ).toBe( false );
	} );
} );
