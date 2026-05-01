/* eslint-disable testing-library/render-result-naming-convention */
// Mock @wordpress/data so the registry selectors run with our injected select function.
const mockGetEntityRecords = jest.fn();
const mockIsResolving = jest.fn();

jest.mock( '@wordpress/core-data', () => ( { store: 'core' } ) );
jest.mock( '@wordpress/data', () => ( {
	createRegistrySelector: ( factory: ( select: unknown ) => unknown ) =>
		factory( () => ( {
			getEntityRecords: mockGetEntityRecords,
			isResolving: mockIsResolving,
		} ) ),
} ) );

import {
	getRenderedMessages,
	getRenderedMessageForConnection,
	isFetchingRenderedMessages,
} from '../rendered-messages';
import type { RenderItem, RenderResult } from '../../../utils/render-messages';

const item = ( id: string ): RenderItem => ( {
	id,
	network: 'x',
	message: '',
	is_social_post: false,
} );

describe( 'rendered-messages selectors', () => {
	beforeEach( () => {
		mockGetEntityRecords.mockReset();
		mockIsResolving.mockReset();
	} );

	describe( 'getRenderedMessages', () => {
		it( 'returns an empty Map when postId is missing', () => {
			const map = getRenderedMessages( {}, 0, [ item( 'a' ) ] );
			expect( map ).toBeInstanceOf( Map );
			expect( map?.size ).toBe( 0 );
			expect( mockGetEntityRecords ).not.toHaveBeenCalled();
		} );

		it( 'returns an empty Map when there are no items', () => {
			const map = getRenderedMessages( {}, 42, [] );
			expect( map?.size ).toBe( 0 );
			expect( mockGetEntityRecords ).not.toHaveBeenCalled();
		} );

		it( 'returns null while any chunk is still resolving', () => {
			mockGetEntityRecords.mockReturnValueOnce( null );

			const map = getRenderedMessages( {}, 42, [ item( 'a' ) ] );
			expect( map ).toBeNull();
		} );

		it( 'returns a merged Map keyed by id when all chunks resolve', () => {
			const records: RenderResult[] = [
				{ id: 'a', rendered_message: 'A' },
				{ id: 'b', rendered_message: 'B' },
			];
			mockGetEntityRecords.mockReturnValueOnce( records );

			const map = getRenderedMessages( {}, 42, [ item( 'a' ), item( 'b' ) ] );

			expect( map?.size ).toBe( 2 );
			expect( map?.get( 'a' )?.rendered_message ).toBe( 'A' );
			expect( map?.get( 'b' )?.rendered_message ).toBe( 'B' );
		} );

		it( 'merges results across multiple chunks', () => {
			// Sized to exceed the default chunk byte budget (~3KB) so chunkRenderItems
			// actually splits the batch into multiple GETs.
			const longMessage = 'x'.repeat( 1500 );
			const items = Array.from( { length: 3 }, ( _, i ) => ( {
				...item( String( i ) ),
				message: longMessage,
			} ) );

			// Chunking will produce >1 chunk for this payload at the default budget; we
			// don't care exactly how many, only that all chunks get merged.
			mockGetEntityRecords.mockImplementation( ( _kind, _name, query ) =>
				query.items.map( ( it: RenderItem ) => ( { id: it.id, rendered_message: `R-${ it.id }` } ) )
			);

			const map = getRenderedMessages( {}, 42, items );

			expect( map?.size ).toBe( items.length );
			for ( const it of items ) {
				expect( map?.get( it.id )?.rendered_message ).toBe( `R-${ it.id }` );
			}
			expect( mockGetEntityRecords.mock.calls.length ).toBeGreaterThan( 1 );
		} );
	} );

	describe( 'getRenderedMessageForConnection', () => {
		it( 'returns the slice for the requested id', () => {
			mockGetEntityRecords.mockReturnValueOnce( [
				{ id: 'a', rendered_message: 'A' },
				{ id: 'b', error: { code: 'render_failed', message: 'oops' } },
			] );

			expect(
				getRenderedMessageForConnection( {}, 42, [ item( 'a' ), item( 'b' ) ], 'a' )
			).toEqual( { id: 'a', rendered_message: 'A' } );
			expect( mockGetEntityRecords.mock.calls ).toHaveLength( 1 );

			mockGetEntityRecords.mockReturnValueOnce( [
				{ id: 'a', rendered_message: 'A' },
				{ id: 'b', error: { code: 'render_failed', message: 'oops' } },
			] );
			expect(
				getRenderedMessageForConnection( {}, 42, [ item( 'a' ), item( 'b' ) ], 'b' )
			).toEqual( { id: 'b', error: { code: 'render_failed', message: 'oops' } } );
		} );

		it( 'returns null when the slice is missing', () => {
			mockGetEntityRecords.mockReturnValueOnce( [ { id: 'a', rendered_message: 'A' } ] );

			expect( getRenderedMessageForConnection( {}, 42, [ item( 'a' ) ], 'unknown' ) ).toBeNull();
		} );

		it( 'returns null while resolving', () => {
			mockGetEntityRecords.mockReturnValueOnce( null );

			expect( getRenderedMessageForConnection( {}, 42, [ item( 'a' ) ], 'a' ) ).toBeNull();
		} );
	} );

	describe( 'isFetchingRenderedMessages', () => {
		it( 'returns false with empty inputs', () => {
			expect( isFetchingRenderedMessages( {}, 0, [ item( 'a' ) ] ) ).toBe( false );
			expect( isFetchingRenderedMessages( {}, 42, [] ) ).toBe( false );
		} );

		it( 'returns true if any chunk is currently resolving', () => {
			mockIsResolving.mockReturnValueOnce( false ).mockReturnValueOnce( true );

			const longMessage = 'x'.repeat( 1500 );
			const items = Array.from( { length: 3 }, ( _, i ) => ( {
				...item( String( i ) ),
				message: longMessage,
			} ) );

			expect( isFetchingRenderedMessages( {}, 42, items ) ).toBe( true );
		} );

		it( 'returns false when no chunk is resolving', () => {
			mockIsResolving.mockReturnValue( false );
			expect( isFetchingRenderedMessages( {}, 42, [ item( 'a' ) ] ) ).toBe( false );
		} );
	} );
} );
